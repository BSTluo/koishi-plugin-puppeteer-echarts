import { Context, Schema, Service, h } from 'koishi';
import * as echarts from 'echarts';
import { } from 'koishi-plugin-puppeteer';

export type EchartsOption = echarts.EChartsOption;

export default class EchartsServer extends Service
{
  static inject = ['puppeteer'];
  static name = 'puppeteer-echarts';
  static usage = `该插件开放一个ctx.echarts.createChart(width: number, height: number, option: echarts.EChartsOption)函数，返回是<img src="data:image/png;base64,xxx" />的字符串，width和height是图表的宽高，option是echarts的配置项。`;


  constructor(ctx: Context)
  {
    super(ctx, 'echarts');
    this.ctx = ctx;
  }

  async createChart(width: number, height: number, option: echarts.EChartsOption)
  {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        html, body, #chart {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div id="chart"></div>
      <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
      <script>
        const chart = echarts.init(document.getElementById('chart'));
        chart.setOption(${JSON.stringify(option)});
      </script>
    </body>
    </html>
  `;

    const page = await this.ctx.puppeteer.page();
    try
    {
      await page.setViewport({ width, height });
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const chartElement = await page.$('#chart');
      const imageBuffer = await chartElement.screenshot({ type: 'png' });

      await page.close();

      const base64 = imageBuffer.toString('base64');
      return `<img src="data:image/png;base64,${base64}" />`;
    } catch (err)
    {
      await page.close();
      console.log(err);
      return '图表渲染失败';
    }

  }
}

declare module 'koishi' {
  interface Context
  {
    echarts: EchartsServer;
  }
}
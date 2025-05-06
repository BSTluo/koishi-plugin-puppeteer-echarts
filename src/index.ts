import { Context, Schema, Service, h } from 'koishi';
import * as echarts from 'echarts';
import { } from 'koishi-plugin-puppeteer';
import path from 'path';

export type EchartsOption = echarts.EChartsOption;

export default class EchartsServer extends Service
{
  static inject = ['puppeteer'];
  static name = 'puppeteer-echarts';
  static usage = `该插件开放一个ctx.echarts.createChart(width: number, height: number, option: echarts.EChartsOption)函数，返回是koishi的图片格式的字符串，width和height是图表的宽高，option是echarts的配置项。`;

  echartsPath: string;

  constructor(ctx: Context)
  {
    super(ctx, 'echarts');
    this.ctx = ctx;

    const rootDir = process.cwd();
    const echartsPath = path.resolve(rootDir, './node_modules/echarts/dist/echarts.min.js');
    this.echartsPath = echartsPath;
  }

  async createChart(width: number, height: number, option: echarts.EChartsOption)
  {

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        html, body, #chart{
          margin: 0;
          padding: 0;
          width: ${width}px;
          height: ${height}px;
          background: transparent;
        }
      </style>
    </head>
    <body>
      <div id="chart"></div>
    </body>
    </html>
  `;

    const page = await this.ctx.puppeteer.page();
    try
    {
      await page.setViewport({ width, height });
      await page.setContent(htmlContent);

      await page.addScriptTag({ path: this.echartsPath });

      await page.evaluate((option) =>
      {
        const chart = echarts.init(document.getElementById('chart'));
        chart.setOption(option);
        chart.resize();
      }, option);

      await page.waitForFunction(() => {
        const chartDiv = document.getElementById('chart');
        return chartDiv && chartDiv.querySelector('canvas') !== null;
      }, { timeout: 2000 });
      

      const imageBuffer = await page.screenshot({ type: 'png' });

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
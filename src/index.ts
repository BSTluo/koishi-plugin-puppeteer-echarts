import { Context, Schema, Service, h } from 'koishi';
import * as echarts from 'echarts';
import { } from 'koishi-plugin-puppeteer';

export const name = 'puppeteer-echarts';

export interface Config { }

export const Config: Schema<Config> = Schema.object({});

export type EchartsOption = echarts.EChartsOption;

export default class EchartsServer extends Service
{
  static inject = ['puppeteer'];

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
    <meta charset="UTF-8">
    <style>
      html, body, #main {
        margin: 0;
        padding: 0;
        width: ${width}px;
        height: ${height}px;
      }
    </style>
  </head>
  <body>
    <div id="main"></div>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
    <script>
      const chart = echarts.init(document.getElementById('main'));
      const option = ${JSON.stringify(option)};
      chart.setOption(option);
      window.chartRendered = true;
    </script>
  </body>
  </html>`;

    const page = await this.ctx.puppeteer.page();
    try
    {
      // await this.ctx.puppeteer.start();
      await page.setViewport({ width, height });
      const over = await this.ctx.puppeteer.render(htmlContent);
      await page.close();

      return over;
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
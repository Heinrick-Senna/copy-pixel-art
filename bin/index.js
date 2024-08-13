#!/usr/bin/env node
import Jimp from "jimp"
import { clipboard, Key, keyboard, mouse, straightTo, up } from "@nut-tree-fork/nut-js";
import sharp from "sharp";
import path from 'path'
import {GlobalKeyboardListener} from "node-global-key-listener";

const inputImage = path.join(process.cwd(), process.argv[2]);
const outPutPath = path.join(process.cwd(), `./Preview.jpg`);

const initX = 985, initY = 175;

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const changeColor = async (color) => {
  let initColorPointX = 1380, initColorPointY = 730;

  await clipboard.setContent(color);
  await mouse.setPosition({ x: initColorPointX, y: initColorPointY });
  await keyboard.type(Key.Enter);
  await mouse.move(up(2));
  await sleep(250);
  await mouse.leftClick();
  await sleep(250);
  await keyboard.pressKey(Key.LeftControl, Key.V);
  await keyboard.releaseKey(Key.LeftControl, Key.V);
  await sleep(50);
  await keyboard.type(Key.Enter);
  await sleep(50);
  await keyboard.type(Key.Enter);
  return;
}

const getColors = async () => {
  const colorMap = {};

  let colorsNum = 256
  process.argv.forEach(arg => arg == '-simples' ? colorsNum = 16 : null);

  // Carregar a imagem original usando Jimp
  const firstImg = await Jimp.read(inputImage);

  // Redimensionar para 32x32 e garantir que não haja transparência
  // firstImg.resize(32, 32, Jimp.RESIZE_BILINEAR).opaque();

  // Converter a imagem para um buffer para ser processada pelo sharp
  const firstBuffer = await firstImg.getBufferAsync(Jimp.MIME_PNG);

  // Reduzir as cores usando sharp
  const lastBuffer = await sharp(firstBuffer)
    .png({ palette: true, colors: colorsNum }) // Reduzir para 16 cores
    .toBuffer()

  const lastImg = await Jimp.read(lastBuffer);
  const fileWidth = lastImg.getWidth();

  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      let color = lastImg.getPixelColor(((fileWidth / 32) / 2) + (x * (fileWidth / 32)), ((fileWidth / 32) / 2) + (y * (fileWidth / 32))).toString(16).padStart(8, '0').slice(0, 6);

      if (!colorMap[color]) colorMap[color] = [];
      colorMap[color].push([x, y]);
    }
  }

  await lastImg.writeAsync(outPutPath);

  return colorMap;
};

const processColors = async () => {
  await fillWhite();
  const colorMap = await getColors();
  console.log("Cores", Object.keys(colorMap).length);

  mouse.config.autoDelayMs = 150;
  mouse.config.mouseSpeed = 30000000;

  await sleep(3000);

  for (const [color, coordsSet] of Object.entries(colorMap)) {
    await sleep(250)
    if (changeColor != 'ffffff') await changeColor(color);
    await sleep(100)
    console.log('Trocado pra cor', color)
    await paintPixels(coordsSet);
    console.log(200)
    console.log('Pixels: ', coordsSet)
  }

  console.log('Finish')
};

const paintPixels = async (coordsSet) => {
  for (const cords of coordsSet) {
    const x = cords[0], y = cords[1];
    await mouse.move(straightTo({ x: initX + (x * 19), y: initY + (y * 19) }));
    await sleep(10)
    await mouse.leftClick();
    await sleep(10);
    await mouse.leftClick();
    await sleep(10)
  }
  return
};


const fillWhite = async () => {
  const initColorPointX = 1080, initColorPointY = 830

  await mouse.setPosition({ x: initColorPointX, y: initColorPointY });
  await mouse.move(up(2));
  await mouse.leftClick();
  await mouse.leftClick();
  await mouse.leftClick();

  await sleep(20)
  await changeColor('ffffff');
  await sleep(20)
  
  await mouse.setPosition({ x: initColorPointX, y: initColorPointY - 80 });
  await mouse.move(up(2))
  await mouse.leftClick();

  await mouse.setPosition({ x: initColorPointX - 80, y: initColorPointY });
  await mouse.move(up(2))
  await mouse.leftClick();
};

const controller = new GlobalKeyboardListener();

controller.addListener(function (e, down) {
  if (e.name == 'ESCAPE') process.exit(0);
});

processColors();
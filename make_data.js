/* 生成带有排序等信息的文件. */

/* 支持自动生成数据. */
makeDataWithOrder()
function makeDataWithOrder()
{
  const fs = require('fs-extra')
  const path = require('path')

  const intentInfo = require("./intent_info.js")

  let intentInfoNew = []
  let index = 1

  /* 在node中遍历时,key的顺序是和原始key的顺序对应的.
  这个特性,并不总是有效,比如在 ios 浏览器中.
  目前,仅仅是够用. */
  let category = ""
  for (let intent in intentInfo) {
    if (intentInfo[intent] == "_category") { /* 说明是一个分类标记. */
      category = intent
      continue
    }
    let title = intentInfo[intent]
    const local_path = localVideoPath(title)
    intentInfoNew.push({
      "type":"video",
      "content":"",
      "intent": intent,
      "title": title,
      "order": index,
      "local_video_path": local_path,
      "ext": path.extname(local_path),
      "category":category,
    })

    ++ index
  }

  localVideoLoseCheck(intentInfoNew)
  const dataPath = path.resolve(__dirname, "./data.json")
  fs.writeJsonSync(dataPath, intentInfoNew)
  console.log(`恭喜!数据已写入 ${dataPath}`)
}

/* 确保视频总数与intent总数是对应的,防止有视频遗漏.
有视频没有对应问题时,会直接抛出异常.
 */
function localVideoLoseCheck(intents)
{
  /* 先把视频信息处理成 key-value. */
  let path = require("path")
  let fs = require ('fs-plus')
  let fse = require('fs-extra')
  let os = require("os")
  let {execSync} = require("child_process")

  let videoDir = path.resolve(__dirname,"./videos")
  let videoDict = fs.listTreeSync(videoDir)
                  .filter(item=>{
                    return [".mov",".mp4"].includes(path.extname(item))
                  })
                  .map(item=>{
                    return path.relative(__dirname,item)
                  })
                  .reduce((sum,item,idx)=>{
                    sum[item] = false
                    return sum
                  },{})

  for (let item of intents) {
    videoDict[item.local_video_path] = true
  }

  /* 寻找缺失的. */
  let loses = []
  for (let item in videoDict) {
    if (!videoDict[item]) {
      loses.push(item)
    }
  }

  if (loses.length) {
    const tip = `一下 ${loses.length} 个视频没有对应的问题:
    ${JSON.stringify(loses)}`
    throw new Error(tip)
  }
}

/* 获取某个标题对应的本地路径.
为了避免未知错误,如果找不到或找到多个,就直接 crash.

@return  本地视频的相对路径.
 */
function localVideoPath(title)
{
  let path = require("path")
  let fs = require ('fs-plus')
  let fse = require('fs-extra')
  let os = require("os")
  let {execSync} = require("child_process")

  let videoDir = path.resolve(__dirname,"./videos")

  let videos = fs.listTreeSync(videoDir)
                  .filter(item=>{
                    return [".mov",".mp4"].includes(path.extname(item))
                  })
                  .map(item=>{
                    return path.relative(__dirname,item)
                  })

  /* 一个标题,能且只能对应一个视频,否则就抛出异常. */
  let localVideoPath = null

  for (let item of videos) {
    if (item.includes(title)) {
      if (localVideoPath) {
        const tip = `致命异常: ${title} 对应的视频重复:
        ${localVideoPath}
        ${item}`

        throw new Error(tip)
      }

      localVideoPath = item
    }
  }

  if (!localVideoPath) {
    const tip = `致命异常!这个标题竟然没有对应的视频:\n${title}`

    throw new Error(tip)
  }

  return localVideoPath
}

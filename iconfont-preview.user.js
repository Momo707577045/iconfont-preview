// ==UserScript==
// @name         iconfont-preview
// @namespace    https://github.com/Momo707577045/iconfont-preview
// @version      0.10.1
// @description  https://github.com/Momo707577045/iconfont-preview 配套插件
// @author       Momo707577045
// @include      *
// @exclude      http://blog.luckly-mjw.cn/*
// @exclude      https://blog.luckly-mjw.cn/*
// @downloadURL	 https://blog.luckly-mjw.cn/tool-show/iconfont-preview/iconfont-preview.user.js
// @updateURL	   https://blog.luckly-mjw.cn/tool-show/iconfont-preview/iconfont-preview.user.js
// @grant        none
// @run-at document-end
// ==/UserScript==

(function () {
  'use strict';
  var originXHR = window.XMLHttpRequest
  var windowOpen = window.open

  function ajax(options) {
    options = options || {};
    let xhr = new originXHR();
    if (options.type === 'file') {
      xhr.responseType = 'arraybuffer';
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        let status = xhr.status;
        if (status >= 200 && status < 300) {
          options.success && options.success(xhr.response);
        } else {
          options.fail && options.fail(status);
        }
      }
    };

    xhr.open("GET", options.url, true);
    xhr.send(null);
  }

  // 检测 icon 链接的有效性
  function checkIconUrl(url) {
    if (/(ttf|woff2|woff)/.test(url)) {
      console.log('【icon】', url, 'http://blog.luckly-mjw.cn/tool-show/iconfont-preview/index.html?source=' + url)
      return url;
    }
  }

  function showIconList(iconUrls) {
    const itemStyle = `
    margin-top: 6px;
    `
    const iconStyle = `
    margin-right: 6px;
    padding: 6px 10px ;
    font-size: 12px;
    color: white;
    border-radius: 4px;
    display: inline-block;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
    `
    const jumpStyle = `
    margin-right: 6px;
    padding: 6px 10px;
    font-size: 12px;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    display: inline-block;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
    `
    const injectStyle = `
    margin-right: 6px;
    padding: 6px 10px ;
    font-size: 12px;
    color: white;
    cursor: pointer;
    border-radius: 4px;
    display: inline-block;
    border: 1px solid #eeeeee;
    background-color: #3D8AC7;
    `
    const deleteStyle = `
    margin-top: 4px;
    height: 34px;
    width: 34px;
    line-height: 34px;
    display: inline-block;
    border-radius: 50px;
    background-color: rgba(0, 0, 0, 0.5);
    `
    var $section = document.createElement('section')
    $section.id = 'icon-group'
    $section.style.position = 'fixed'
    $section.style.zIndex = '9999'
    $section.style.top = '20px'
    $section.style.right = '20px'
    $section.style.textAlign = 'center'
    iconUrls.forEach(url => {
      var $icon = document.createElement('div')
      $icon.style = itemStyle
      $icon.innerHTML = `
      <div style="${iconStyle}">${url}</div>
      <div style="${jumpStyle}" class="icon-jump" data-id="${url}">跳转解析</div>
      <div style="${injectStyle}" class="icon-inject" data-id="${url}">注入解析</div>`
      $section.appendChild($icon);
    })

    var $delete = document.createElement('div')
    $delete.id = 'icon-show-delete'
    $delete.style = deleteStyle
    $delete.innerHTML = `
    <img style="
    padding-top: 4px;
    width: 24px;
    cursor: pointer;
  " src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAk1BMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ROyVeAAAAMHRSTlMA1Sq7gPribxkJx6Ey8onMsq+GTe10QF8kqJl5WEcvIBDc0sHAkkk1FgO2ZZ+dj1FHfPqwAAACNElEQVRIx6VW6ZqqMAwtFlEW2Rm3EXEfdZa+/9PdBEvbIVXu9835oW1yjiQlTWQE/iYPuTObOTzMNz4bQFRlY2FgnFXRC/o01mytiafP+BPvQZk56bcLSOXem1jpCy4QgXvRtlEVCARfUP65RM/hp29/+0R7eSbhoHlnffZ8h76e6x1tyw9mxXaJ3nfTVLd89hQr9NfGceJxfLIXmONh6eNNYftNSESRmgkHlEOjmhgBbYcEW08FFQN/ro6dvAczjhgXEdQP76xHEYxM+igQq259gLrCSlwbD3iDtTMy+A4Yuk0B6zV8c+BcO2OgFIp/UvJdG4o/Rp1JQYXeZFflPEFMfvugiFGFXN587YtgX7C8lRGFXPCGGYCCzlkoxJ4xqmi/jrIcdYYh5pwxiwI/gt7lDDFrcLiMKhBJ//W78ENsJgVUsV8wKpjZBXshM6cCW0jbRAilICFxIpgGMmmiWGHSIR6ViY+DPFaqSJCbQ5mbxoZLIlU0Al/cBj6N1uXfFI0okLppi69StmumSFQRP6oIKDedFi3vRDn3j6KozCZlu0DdJb3AupJXNLmqkk9+X9FEHLt1Jq8oi1H5n01AtRlvwQZQl9hmtPY4JEjMDs5ftWJN4Xr4lLrV2OHiUDHCPgvA/Tn/hP4zGUBfjZ3eLJ+NIOfHxi8CMoAQtYfmw93v01O0e7VlqqcCsXML3Vsu94cxnb4c7ML5chG8JIP9b38dENGaj3+x+TpiA/AL/fen8In7H8l3ZjdJQt2TAAAAAElFTkSuQmCC">
`
    $delete.addEventListener('click', () => {
      document.querySelector('#icon-group').remove()
    })
    $section.appendChild($delete);

    document.body.appendChild($section);
    document.querySelectorAll('.icon-jump').forEach(node => {
      node.addEventListener('click', ($node) => {
        iconJump($node.target.dataset.id)
      })
    })
    document.querySelectorAll('.icon-inject').forEach(node => {
      node.addEventListener('click', ($node) => {
        iconInject($node.target.dataset.id)
      })
    })
  }

  function iconJump(iconTarget) {
    windowOpen('//blog.luckly-mjw.cn/tool-show/iconfont-preview/index.html?source=' + iconTarget)
  }

  function iconInject(iconTarget) {
    var _hmt = _hmt || [];
    (function () {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?1f12b0865d866ae1b93514870d93ce89";
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(hm, s);
    })();
    ajax({
      url: 'https://blog.luckly-mjw.cn/tool-show/iconfont-preview/index.html?t=' + new Date().getTime(),
      success: (fileStr) => {
        let fileList = fileStr.split(`<!--vue 前端框架--\>`);
        let dom = fileList[0];
        let script = fileList[1] + fileList[2];
        script = script.split('// script注入');
        script = script[1];

        if (iconTarget) {
          script = script.replace(`url: '//at.alicdn.com/t/font_1349299_kjq7u4s9t8m.css', // 在线链接`, `url: '${iconTarget}',`);
        }
        if (document.querySelector('#iconfont-preview-inject')) {
          document.querySelector('#iconfont-preview-inject').remove()
        }

        // 注入html
        let $section = document.createElement('section')
        $section.innerHTML = `${dom}`
        $section.id = 'iconfont-preview-inject'
        $section.style.width = '100%'
        $section.style.height = '100%'
        $section.style.top = '0'
        $section.style.left = '0'
        $section.style.position = 'absolute'
        $section.style.zIndex = '9999'
        $section.style.fontSize = '14px'
        $section.style.overflowY = 'auto'
        $section.style.backgroundColor = 'white'
        document.body.appendChild($section);

        ajax({ // ttf文件解析库
          url: 'https://upyun.luckly-mjw.cn/lib/opentype.min.js',
          success: (opentypeSaverStr) => {
            let $opentypeSaver = document.createElement('script')
            $opentypeSaver.innerHTML = opentypeSaverStr
            document.body.appendChild($opentypeSaver);
            ajax({ // 加载 woff2 解码库
              url: 'https://upyun.luckly-mjw.cn/lib/woff2-decode.js',
              success: (woff2Str) => {
                let $woff2 = document.createElement('script')
                $woff2.innerHTML = woff2Str
                document.body.appendChild($woff2);
                ajax({ // 加载 vue
                  url: 'https://upyun.luckly-mjw.cn/lib/vue.js',
                  success: (vueStr) => {
                    let $vue = document.createElement('script')
                    $vue.innerHTML = vueStr
                    document.body.appendChild($vue);
                    alert('注入成功，请滚动到页面底部')
                    eval(script)
                  }
                })
              }
            })
          }
        })
      },
    })
  }

  setTimeout(() => {
    const iconUrls = performance.getEntries().map(item => item.name).filter(url => checkIconUrl(url));
    showIconList(iconUrls);
  }, 2000)
})();

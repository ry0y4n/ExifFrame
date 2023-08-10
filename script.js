window.onload = function () {
  // ファイル操作関連
  const fileInput = document.getElementById('upload');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // ローディング関連
  const loadingDiv = document.getElementById('loading');

  // サンプル画像関連
  const sampleContent = document.getElementById('sampleContent');
  const slideShowImage = document.getElementById('slideshowImage');

  // 結果画像表示関連
  const contentsDiv = document.getElementById('resultContents');
  const resultImage = document.getElementById('resultImage');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  // 結果表示・修正フォーム関連
  const modelInput = document.getElementById('modelInput');
  const makeInput = document.getElementById('makeInput');
  const focalLengthIn35mmFilmInput = document.getElementById('focalLengthIn35mmFilmInput');
  const fNumberInput = document.getElementById('fNumberInput');
  const exposureTimeInput = document.getElementById('exposureTimeInput');
  const isoSpeedRatingsInput = document.getElementById('isoSpeedRatingsInput');
  const fixInfoBtn = document.getElementById('fixInfoBtn');

  let imgData = null;
  let isFontsLoaded = false;
  let isImageDisplayed = true;

  uploadBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {

    // サンプルコンテンツを非表示にしてローディング画面を表示
    sampleContent.style.display = 'none';
    toggleImageDisplay();
    toggleLoading();

    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onloadend = function () {
      let img = new Image();
      img.onload = function () {

        // 修正用に元画像を変数に保存
        imgData = img;

        // EXIF情報を取得
        let exifData = {};
        // レンズ情報を取得するためにExif.jsのタグを追加
        EXIF.Tags[0xA432]="LensSpecification";
        EXIF.Tags[0xA433]="LensMake";
        EXIF.Tags[0xA434]="LensModel";
        EXIF.Tags[0xA435]="LensSerialNumber";
        EXIF.getData(img, function () {
          exifData = EXIF.getAllTags(this);
        });

        // フォント読み込みとテキストの描画（フォントの二重読み込み防止処理）
        if (isFontsLoaded) {
          draw(exifData)
        } else {
          loadFonts().then(function () {
            draw(exifData)
          });
        }

      }
      img.src = reader.result;
    }

    if (file) {
      reader.readAsDataURL(file);
    }

    downloadBtn.addEventListener('click', function () {
      // aタグを作成してclickイベントを発生させることで、キャンバス内容を画像としてダウンロード
      let a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg');
      let fileNameWithoutExtension = file.name.split('.')[0];
      a.download = fileNameWithoutExtension + '-frame.jpeg';
      a.click();
    });
  }, false);

  fixInfoBtn.addEventListener('click', function () {
    exifData = {
      Model: modelInput.value,
      Make: makeInput.value,
      FocalLengthIn35mmFilm: focalLengthIn35mmFilmInput.value,
      FNumber: fNumberInput.value,
      ExposureTimeString: exposureTimeInput.value,
      ISOSpeedRatings: isoSpeedRatingsInput.value
    }
    toggleImageDisplay();
    draw(exifData)
  });

  // サンプル画像のスライドショー
  function slideshowtimer() {
    if (slideNum === 3) {
      slideNum = 0;
    }
    else {
      slideNum++;
    }
    slideShowImage.src = `samples/sample${slideNum + 1}.jpeg`;
  }

  let slideNum = 0;
  setInterval(slideshowtimer, 3000);

  function loadFonts() {
    // CSS Font Loading APIを使用してフォントを読み込む
    const fontInter400 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-regular.woff2)', { weight: '400' });
    const fontInter500 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-500.woff2)', { weight: '500' });
    const fontInter700 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-700.woff2)', { weight: '700' });

    return Promise.all([fontInter400.load(), fontInter500.load(), fontInter700.load()]).then(function (loadedFonts) {
      loadedFonts.forEach(function (loadedFont) {
        document.fonts.add(loadedFont);
      });

      isFontsLoaded = true;
    }).catch(function (error) {
      alert('フォントの読み込みに失敗しました: ' + error);
    });
  }

  function draw(exifData) {
    let text1 = '';
    let text2 = '';
    let text3 = '';
    // 画像に応じたマージンやフォントサイズを計算
    const HORIZONTAL_MARGIN = imgData.width * 0.025;  // 余白の大きさ
    const BOTTOM_MARGIN = imgData.width > imgData.height ? imgData.height * 0.25 : imgData.width * 0.17;  // 下部の余白の大きさ
    const BASE_FONT_SIZE = imgData.width > imgData.height ? imgData.height * 0.0275 : imgData.width * 0.02  // ベースとなるフォントサイズ
    const FONT_FAMILY = 'Inter, sans-serif' // フォント
    const LINE_SPACING = imgData.width > imgData.height ? imgData.height * 0.005 : imgData.width * 0.0045;  // 行間

    // キャンバスサイズを画像サイズ＋枠分に設定
    canvas.width = imgData.width + HORIZONTAL_MARGIN * 2;
    canvas.height = imgData.height + BOTTOM_MARGIN;

    // 白い背景を描画
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画像を描画（余白の分だけずらして描画）
    ctx.drawImage(imgData, HORIZONTAL_MARGIN, HORIZONTAL_MARGIN, imgData.width, imgData.height);

    // テキストを描画（下部の余白に）
    ctx.fillStyle = '#747474';  // 文字色
    ctx.font = '400 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;  // フォントの設定
    // ctx.textAlign = 'center';  // 水平中央揃え
    ctx.textBaseline = 'middle';  // 垂直中央揃え
    let textCenter = canvas.height - BOTTOM_MARGIN / 2 // 下の余白の中央位置

    // 一部のテキストを太字にするための準備
    text1 = exifData.Make + '  ';
    text2 = exifData.Model;
    if ("LensModel" in exifData) {
      text2 += '  /  ';
      text3 = exifData.LensModel;
    }
    let text1Width = ctx.measureText(text1).width;
    let text2Width = ctx.measureText(text2).width;
    let textStart = canvas.width / 2 - (text1Width + text2Width + ctx.measureText(text3).width) / 2;

    // 2行目のテキスト情報取得
    let exposureTime;
    if (exifData.ExposureTime != undefined) {
      exposureTime = exifData.ExposureTime >= 1 ? exifData.ExposureTime : `1/${Math.round(1 / exifData.ExposureTime)}`;
    } else {
      exposureTime = exifData.ExposureTimeString;
    }

    let focalLengthText = exifData.FocalLengthIn35mmFilm ? `${exifData.FocalLengthIn35mmFilm}mm ` : '';
    let fNumberText = exifData.FNumber ? `f/${exifData.FNumber} ` : '';
    let exposureTimeText = exposureTime ? `${exposureTime}s ` : '';
    let isoSpeedRatingsText = exifData.ISOSpeedRatings ? `ISO${exifData.ISOSpeedRatings}` : '';
    let finalText = focalLengthText + fNumberText + exposureTimeText + isoSpeedRatingsText;

    // フォームに反映
    modelInput.value = exifData.Model;
    makeInput.value = exifData.Make;
    focalLengthIn35mmFilmInput.value = focalLengthText.replace('mm ', '');
    fNumberInput.value = fNumberText.replace('f/', '').replace(' ', '');
    exposureTimeInput.value = exposureTimeText.replace('s ', '');
    isoSpeedRatingsInput.value = isoSpeedRatingsText.replace('ISO', '');

    // テキスト描画
    let textHeight = finalText ? textCenter - LINE_SPACING : textCenter + BASE_FONT_SIZE / 2; // 2行目テキストがある場合は上に、ない場合は中央にずらす
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;  // フォントの設定を変更
    ctx.fillStyle = '#000000';  // 文字色
    ctx.fillText(text1, textStart, textHeight);
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;  // フォントの設定を変更
    ctx.fillStyle = '#000000';  // 文字色
    ctx.fillText(text2, textStart + text1Width, textHeight);
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;  // フォントの設定を戻す
    // ctx.fillStyle = '#343434';  // 文字色
    ctx.fillText(text3, textStart + text1Width + text2Width, textHeight);

    ctx.textAlign = 'center';  // 水平中央揃え
    ctx.font = '400 ' + BASE_FONT_SIZE * 0.8 + 'px ' + FONT_FAMILY;  // フォントの設定
    ctx.fillStyle = '#747474';  // 文字色
    ctx.fillText(finalText, canvas.width / 2, textCenter + LINE_SPACING + BASE_FONT_SIZE);

    // 画像の描画処理
    let result = canvas.toDataURL();

    if (result === "data:,") {
      alert("フレームの生成に失敗しました。\n画像の縦幅、横幅を小さくして試してみてください。");
      return;
    }

    resultImage.src = result;
    toggleLoading(false);
    toggleImageDisplay();
  }

  function toggleImageDisplay() {
    contentsDiv.style.display = isImageDisplayed ? 'none' : 'block';
    isImageDisplayed = !isImageDisplayed;
  }

  function toggleLoading(isDisplay = true) {
    loadingDiv.style.display = isDisplay ? 'flex' : 'none';
  }
}
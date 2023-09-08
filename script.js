import { initializeApp } from 'firebase/app';
import { getRemoteConfig, getValue, fetchAndActivate } from 'firebase/remote-config';

window.onload = async function () {
  let file;
  let imgData = null;
  let isFontsLoaded = false;
  let isFramingSquare = false;

  // フィーチャートグル関連
  const remoteConfig = initFirebaseRemoteConfig();
  const isModeToggleFlag = await getFeatureFlagValue(remoteConfig, 'mode_toggle');
  const isExifPresetFlag = await getFeatureFlagValue(remoteConfig, 'exif_preset');
  if (isModeToggleFlag === 'true') {
    const toggleModeDiv = document.getElementById('toggleMode');
    if (toggleModeDiv !== null) toggleModeDiv.style.display = 'block';
  }
  if (isExifPresetFlag === 'true') {
    const presetsArea = document.getElementById('presetsArea');
    if (presetsArea !== null) presetsArea.style.display = 'block';
  }

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
  const makeInput = document.getElementById('makeInput');
  const modelInput = document.getElementById('modelInput');
  const lensInput = document.getElementById('lensInput');
  const focalLengthIn35mmFilmInput = document.getElementById('focalLengthIn35mmFilmInput');
  const fNumberInput = document.getElementById('fNumberInput');
  const exposureTimeInput = document.getElementById('exposureTimeInput');
  const isoSpeedRatingsInput = document.getElementById('isoSpeedRatingsInput');
  const fixInfoBtn = document.getElementById('fixInfoBtn');

  // モード切り替え関連
  const framingSquareCheckbox = document.getElementById('framingSquareCheckbox');

  // Exif設定登録関連
  const presetPropertySelector = document.getElementById('presetPropertySelector');
  const presetValueInput = document.getElementById('presetValueInput');
  const savePresetButton = document.getElementById('savePresetButton');

  framingSquareCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      isFramingSquare = true;
      document.querySelector('.toggle-button__text').innerHTML = '正方形';
    } else {
      isFramingSquare = false;
      document.querySelector('.toggle-button__text').innerHTML = '標準';
    }
  });

  savePresetButton.addEventListener('click', () => {
    // 空文字チェック
    if (presetValueInput.value === '') return;

    // localStorage取得
    let exifPresets = JSON.parse(localStorage.getItem('exifPresets'));

    // 無ければ初期化
    if (exifPresets === null) {
      exifPresets = {
        メーカー名: [],
        機種名: [],
        レンズ: [],
        焦点距離: [],
        絞り: [],
        シャッタースピード: [],
        ISO感度: [],
      };
    }

    // 設定追加
    exifPresets[`${presetPropertySelector.value}`].push(presetValueInput.value);

    // 重複してたら削除
    exifPresets[`${presetPropertySelector.value}`] = [...new Set(exifPresets[`${presetPropertySelector.value}`])];

    // localStorageに保存
    localStorage.setItem('exifPresets', JSON.stringify(exifPresets));

    // UI更新
    displayExifPresets();
  });

  uploadBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener(
    'change',
    function (e) {
      // サンプルコンテンツを非表示にしてローディング画面を表示
      sampleContent.style.display = 'none';
      toggleImageDisplay(false);
      toggleLoading(true);

      file = e.target.files[0];
      let reader = new FileReader();

      reader.onloadend = function () {
        let img = new Image();
        img.onload = function () {
          // 修正用に元画像を変数に保存
          imgData = img;

          // EXIF情報を取得
          let exifData = {};
          // レンズ情報を取得するためにExif.jsのタグを追加
          EXIF.Tags[0xa432] = 'LensSpecification';
          EXIF.Tags[0xa433] = 'LensMake';
          EXIF.Tags[0xa434] = 'LensModel';
          EXIF.Tags[0xa435] = 'LensSerialNumber';
          EXIF.getData(img, function () {
            exifData = EXIF.getAllTags(this);
          });

          // フォント読み込みとテキストの描画（フォントの二重読み込み防止処理）
          if (isFontsLoaded) {
            draw(exifData);
          } else {
            loadFonts().then(function () {
              draw(exifData);
            });
          }
        };
        img.src = reader.result;
      };

      if (file) {
        reader.readAsDataURL(file);
      }

      // ダウンロードボタンを有効化
      downloadBtn.disabled = false;
    },
    false,
  );

  downloadBtn.addEventListener('click', function () {
    // aタグを作成してclickイベントを発生させることで、キャンバス内容を画像としてダウンロード
    let a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg');
    let fileNameWithoutExtension = file.name.split('.')[0];
    a.download = fileNameWithoutExtension + '-frame.jpeg';
    a.click();
  });

  fixInfoBtn.addEventListener('click', function () {
    let inputs = {
      Make: makeInput.value,
      Model: modelInput.value,
      LensModel: lensInput.value,
      FocalLengthIn35mmFilm: focalLengthIn35mmFilmInput.value,
      FNumber: fNumberInput.value,
      ExposureTimeString: exposureTimeInput.value,
      ISOSpeedRatings: isoSpeedRatingsInput.value,
    };

    let exifData = {};

    for (let key in inputs) {
      let trimed_input = inputs[key].trim();
      if (trimed_input !== '') {
        exifData[key] = trimed_input;
      }
    }
    toggleImageDisplay(false);
    draw(exifData);
  });

  // サンプル画像のスライドショー
  function slideshowtimer() {
    if (slideNum === 3) {
      slideNum = 0;
    } else {
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

    return Promise.all([fontInter400.load(), fontInter500.load(), fontInter700.load()])
      .then(function (loadedFonts) {
        loadedFonts.forEach(function (loadedFont) {
          document.fonts.add(loadedFont);
        });

        isFontsLoaded = true;
      })
      .catch(function (error) {
        alert('フォントの読み込みに失敗しました: ' + error);
      });
  }

  function draw(exifData) {
    // 画像に応じたマージンやフォントサイズを計算
    const { HORIZONTAL_MARGIN, VERTICAL_MARGIN, BOTTOM_MARGIN } = calculateMargin(imgData); // 上下の余白の大きさ

    const BASE_FONT_SIZE = imgData.width > imgData.height ? imgData.height * 0.0275 : imgData.width * 0.02; // ベースとなるフォントサイズ
    const FONT_FAMILY = 'Inter, sans-serif'; // フォント
    const LINE_SPACING = imgData.width > imgData.height ? imgData.height * 0.005 : imgData.width * 0.0045; // 行間

    // キャンバスサイズを画像サイズ＋枠分に設定
    canvas.width = imgData.width + HORIZONTAL_MARGIN * 2;
    canvas.height = imgData.height + VERTICAL_MARGIN * 2 + BOTTOM_MARGIN;

    // 白い背景を描画
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画像を描画（余白の分だけずらして描画）
    ctx.drawImage(imgData, HORIZONTAL_MARGIN, VERTICAL_MARGIN, imgData.width, imgData.height);

    const { upperText, lowerText } = createCaption(exifData);
    // 正方形モードでなければテキストを描画
    if (!isFramingSquare) {
      addText(upperText, lowerText, VERTICAL_MARGIN, BOTTOM_MARGIN, BASE_FONT_SIZE, FONT_FAMILY, LINE_SPACING);
    }

    // 画像の描画処理
    let result = canvas.toDataURL();

    if (result === 'data:,') {
      alert('フレームの生成に失敗しました。\n画像の縦幅、横幅を小さくして試してみてください。');
      return;
    }

    resultImage.src = result;
    toggleLoading(false);
    toggleImageDisplay(true);
  }

  function calculateMargin(imgData) {
    if (isFramingSquare) {
      if (imgData.width > imgData.height) {
        return {
          HORIZONTAL_MARGIN: imgData.width * 0.025,
          VERTICAL_MARGIN: (imgData.width + imgData.width * 0.025 * 2 - imgData.height) / 2,
          BOTTOM_MARGIN: 0,
        };
      } else {
        return {
          HORIZONTAL_MARGIN: (imgData.height + imgData.height * 0.025 * 2 - imgData.width) / 2,
          VERTICAL_MARGIN: imgData.width * 0.025,
          BOTTOM_MARGIN: 0,
        };
      }
    } else {
      return {
        HORIZONTAL_MARGIN: imgData.width * 0.025, // 左右の余白の大きさ
        VERTICAL_MARGIN: imgData.width * 0.025, // 上下の余白の大きさ
        BOTTOM_MARGIN: imgData.width > imgData.height ? imgData.height * 0.25 : imgData.width * 0.17, // 下部の余白の大きさ
      };
    }
  }

  function addText(upperText, lowerText, VERTICAL_MARGIN, BOTTOM_MARGIN, BASE_FONT_SIZE, FONT_FAMILY, LINE_SPACING) {
    // テキストを描画（下部の余白に）
    ctx.fillStyle = '#747474'; // 文字色
    ctx.font = '400 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY; // フォントの設定
    // ctx.textAlign = 'center';  // 水平中央揃え
    ctx.textBaseline = 'middle'; // 垂直中央揃え
    let textVerticalCenter = canvas.height - (BOTTOM_MARGIN + VERTICAL_MARGIN * 2) / 2; // 下の余白の中央位置

    // テキスト描画
    let upperTextHeight = lowerText ? textVerticalCenter - LINE_SPACING : textVerticalCenter + BASE_FONT_SIZE / 2; // 2行目テキストがある場合は上に、ない場合は中央にずらす
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY; // フォントの設定を変更
    ctx.fillStyle = '#000000'; // 文字色
    ctx.textAlign = 'center'; // 水平中央揃え
    ctx.fillText(upperText, canvas.width / 2, upperTextHeight);

    ctx.font = '400 ' + BASE_FONT_SIZE * 0.8 + 'px ' + FONT_FAMILY; // フォントの設定
    ctx.fillStyle = '#747474'; // 文字色
    ctx.fillText(lowerText, canvas.width / 2, textVerticalCenter + LINE_SPACING + BASE_FONT_SIZE);
  }

  function createCaption(exifData) {
    let upperText = '';

    // 1行目のテキスト情報取得
    if ('Make' in exifData) {
      upperText = exifData.Make.replace(/\u0000/g, '');
    }
    if ('Model' in exifData) {
      upperText += '  ' + exifData.Model.replace(/\u0000/g, '');
    }
    if ('LensModel' in exifData) {
      upperText += '  /  ' + exifData.LensModel.replace(/\u0000/g, '');
    }

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
    let lowerText = focalLengthText + fNumberText + exposureTimeText + isoSpeedRatingsText;

    // フォームに反映
    makeInput.value = 'Make' in exifData ? exifData.Make : '';
    modelInput.value = 'Model' in exifData ? exifData.Model : '';
    lensInput.value = 'LensModel' in exifData ? exifData.LensModel : '';
    focalLengthIn35mmFilmInput.value = focalLengthText.replace('mm ', '');
    fNumberInput.value = fNumberText.replace('f/', '').replace(' ', '');
    exposureTimeInput.value = exposureTimeText.replace('s ', '');
    isoSpeedRatingsInput.value = isoSpeedRatingsText.replace('ISO', '');

    return {
      upperText: upperText,
      lowerText: lowerText,
    };
  }

  function toggleImageDisplay(isDisplay) {
    contentsDiv.style.display = isDisplay ? 'block' : 'none';
  }

  function toggleLoading(isDisplay) {
    loadingDiv.style.display = isDisplay ? 'flex' : 'none';
  }

  function initFirebaseRemoteConfig() {
    //  App's Firebase configuration
    const firebaseConfig = {
      apiKey: 'AIzaSyDD2F3dAbQEyqBdWid26Xc7fu1X0_aqewc',
      authDomain: 'exifframe-featuretoggle.firebaseapp.com',
      projectId: 'exifframe-featuretoggle',
      storageBucket: 'exifframe-featuretoggle.appspot.com',
      messagingSenderId: '680319808704',
      appId: '1:680319808704:web:35df1d29fec3131fc0e925',
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Remote Config and get a reference to the service
    const remoteConfig = getRemoteConfig(app);

    // remoteConfig.settings.minimumFetchIntervalMillis = 0; // for development. default is 12 hours.

    return remoteConfig;
  }

  async function getFeatureFlagValue(remoteConfig, parameter) {
    await fetchAndActivate(remoteConfig);
    const val = getValue(remoteConfig, parameter);
    return val['_value'];
  }

  function displayExifPresets() {
    const tableContent = document.getElementById('exifPresetsTable');
    const exifPresets = JSON.parse(localStorage.getItem('exifPresets'));

    // localStorageにデータがあればテーブルを表示
    if (exifPresets !== null) {
      tableContent.style.display = 'table';
    } else {
      return;
    }

    // UIに反映
    const tableBody = tableContent.getElementsByTagName('tbody')[0];
    while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
    }
    for (const property in exifPresets) {
      if (exifPresets[property].length) {
        const rowspan = exifPresets[property].length;
        // 最初の行を作成
        const row1 = tableBody.insertRow();
        const cell1 = row1.insertCell();
        const cell2 = row1.insertCell();
        const cell3 = row1.insertCell();
        const cell4 = row1.insertCell();
        const cell5 = row1.insertCell();
        cell1.rowSpan = rowspan;
        cell1.innerHTML = property;
        cell2.innerHTML = '<input type="text" class="presets-area__input" value="' + exifPresets[property][0] + '" />';
        cell3.appendChild(createButton('update', property, 0, cell2));
        cell4.appendChild(createButton('delete', property, 0));
        cell5.appendChild(createButton('set', property, 0, cell2));

        // 残りの行を作成
        for (let i = 1; i < rowspan; i++) {
          const row = tableBody.insertRow();
          const cellValue = row.insertCell();
          const cellUpdateBtn = row.insertCell();
          const cellDeleteBtn = row.insertCell();
          const cellSetBtn = row.insertCell();
          cellValue.innerHTML = '<input type="text" class="presets-area__input" value="' + exifPresets[property][i] + '" />';
          cellUpdateBtn.appendChild(createButton('update', property, i, cellValue));
          cellDeleteBtn.appendChild(createButton('delete', property, i));
          cellSetBtn.appendChild(createButton('set', property, i, cellValue));
        }
      }
    }
  }

  function createButton(mode, property, i, textEl = null) {
    const button = document.createElement('button');
    button.classList.add('button', 'presets-area__button');
    if (mode === 'update') {
      button.innerHTML = '更新';
      button.addEventListener('click', () => {
        manageExifPresets(mode, property, i, textEl);
      });
    } else if (mode === 'delete') {
      button.innerHTML = '削除';
      button.addEventListener('click', () => {
        manageExifPresets(mode, property, i, textEl);
      });
    } else {
      button.innerHTML = '反映';
      button.classList.add('presets-area__button--set');
      button.addEventListener('click', () => {
        const resultTableList = Array.from(document.querySelectorAll('.result-table__item'));

        const inputEl = resultTableList.filter((item) => item.textContent === property).map((item) => item.nextElementSibling)[0];

        inputEl.value = textEl.firstChild.value;
      });
    }

    return button;
  }

  function manageExifPresets(mode, property, i, textEl = null) {
    const exifPresets = JSON.parse(localStorage.getItem('exifPresets'));

    if (mode === 'update') {
      exifPresets[property][i] = textEl.firstChild.value;
      localStorage.setItem('exifPresets', JSON.stringify(exifPresets));
    } else {
      exifPresets[property].splice(i, 1);
      localStorage.setItem('exifPresets', JSON.stringify(exifPresets));
      displayExifPresets();
    }
  }

  displayExifPresets();
};

window.onload = function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('upload');
    const uploadBtn = document.getElementById('uploadBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resultImage = document.getElementById('resultImage');
    const contentsDiv = document.getElementById('contents');
    const modelInput = document.getElementById('modelInput');
    const makeInput = document.getElementById('makeInput');
    const focalLengthIn35mmFilmInput = document.getElementById('focalLengthIn35mmFilmInput');
    const fNumberInput = document.getElementById('fNumberInput');
    const exposureTimeInput = document.getElementById('exposureTimeInput');
    const isoSpeedRatingsInput = document.getElementById('isoSpeedRatingsInput');
    const fixInfoBtn = document.getElementById('fixInfoBtn');

    let imgData = null;
    let isFontsLoaded = false;

    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.onloadend = function() {
            let img = new Image();
            img.onload = function() {

                imgData = img;

                // EXIF情報を取得
                let exifData = {};
                EXIF.getData(img, function() {
                    exifData = EXIF.getAllTags(this);
                });

                // フォント読み込みとテキストの描画（フォントの二重読み込み防止処理）
                if (isFontsLoaded) {
                    draw(exifData)
                } else {
                    loadFonts().then(function() {
                        draw(exifData)
                    });
                }

                displayContents(exifData)

            }
            img.src = reader.result;
        }

        if (file) {
            reader.readAsDataURL(file);
        }

        downloadBtn.addEventListener('click', function() {
            // aタグを作成してclickイベントを発生させることで、キャンバス内容を画像としてダウンロード
            let a = document.createElement('a');
            a.href = canvas.toDataURL('image/jpeg');
            let fileNameWithoutExtension = file.name.split('.')[0];
            a.download = fileNameWithoutExtension + '-frame.jpeg';
            a.click();
        });
    }, false);

    fixInfoBtn.addEventListener('click', function() {
        exifData = {
            Model: modelInput.value,
            Make: makeInput.value,
            FocalLengthIn35mmFilm: focalLengthIn35mmFilmInput.value,
            FNumber: fNumberInput.value,
            ExposureTimeString: exposureTimeInput.value,
            ISOSpeedRatings: isoSpeedRatingsInput.value
        }
        draw(exifData)
    });

    function loadFonts() {
        // CSS Font Loading APIを使用してフォントを読み込む
        const fontInter400 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-regular.woff2)', { weight: '400' });
        const fontInter500 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-500.woff2)', { weight: '500' });
        const fontInter700 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-700.woff2)', { weight: '700' });

        return Promise.all([fontInter400.load(), fontInter500.load(), fontInter700.load()]).then(function(loadedFonts) {
                loadedFonts.forEach(function(loadedFont) {
                    document.fonts.add(loadedFont);
                });
                
                isFontsLoaded = true;
            }).catch(function(error) {
                alert('フォントの読み込みに失敗しました: ' + error);
            });
    }

    function draw(exifData) {
        let margin = imgData.width * 0.025;  // 余白の大きさ
        let bottomMargin = imgData.height * 0.25;  // 下部の余白の大きさ
        let baseFontSize = imgData.height * 0.0275
        const fontFamily = 'Inter, sans-serif'

        // キャンバスサイズを画像サイズ＋枠分に設定
        canvas.width = imgData.width + margin * 2;
        canvas.height = imgData.height + bottomMargin;

        // 白い背景を描画
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 画像を描画（余白の分だけずらして描画）
        ctx.drawImage(imgData, margin, margin, imgData.width, imgData.height);

        // テキストを描画（下部の余白に）
        ctx.fillStyle = '#747474';  // 文字色
        ctx.font = '400 ' + baseFontSize + 'px ' + fontFamily;  // フォントの設定
        // ctx.textAlign = 'center';  // 水平中央揃え
        ctx.textBaseline = 'middle';  // 垂直中央揃え
        let lineSpacing = imgData.height * 0.005;  // 行間
        let textCenter = canvas.height - bottomMargin / 2 // 下の余白の中央位置

        // 一部のテキストを太字にするための準備
        let text1 = 'Shot on ';
        let text2 = exifData.Model + '  ';
        let text3 = exifData.Make;
        let text1Width = ctx.measureText(text1).width;
        let text2Width = ctx.measureText(text2).width;
        let textStart = canvas.width / 2 - (text1Width + text2Width + ctx.measureText(text3).width) / 2;

        // 2行目のテキスト情報取得
        let exposureTime;
        if (exifData.ExposureTime != undefined) {
            exposureTime = exifData.ExposureTime >= 1 ? exifData.ExposureTime : `1/${Math.round(1/exifData.ExposureTime)}`;
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
        let textHeight = finalText ? textCenter - lineSpacing : textCenter + baseFontSize / 2; // 2行目テキストがある場合は上に、ない場合は中央にずらす
        ctx.fillText(text1, textStart, textHeight);
        ctx.font = '700 ' + baseFontSize + 'px ' + fontFamily;  // フォントの設定を変更
        ctx.fillStyle = '#000000';  // 文字色
        ctx.fillText(text2, textStart + text1Width, textHeight);
        ctx.font = '500 ' + baseFontSize + 'px ' + fontFamily;  // フォントの設定を戻す
        ctx.fillStyle = '#343434';  // 文字色
        ctx.fillText(text3, textStart + text1Width + text2Width, textHeight);

        ctx.textAlign = 'center';  // 水平中央揃え
        ctx.font = '400 ' + baseFontSize * 0.8 + 'px ' + fontFamily;  // フォントの設定
        ctx.fillStyle = '#747474';  // 文字色
        ctx.fillText(finalText, canvas.width / 2, textCenter + lineSpacing + baseFontSize);

        // 画像の描画処理
        resultImage.src = canvas.toDataURL(); 
    }

    function displayContents(exifData) {
        contentsDiv.style.display = 'block';
    }
}
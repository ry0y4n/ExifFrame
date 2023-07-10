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

                displayContents(exifData)

                draw(exifData);

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

    function draw(exifData) {
        let margin = imgData.width * 0.025;  // 余白の大きさ
        let bottomMargin = imgData.height * 0.25;  // 下部の余白の大きさ
        let baseFontSize = imgData.height * 0.0275

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
        ctx.font = '400 ' + baseFontSize + 'px sans-serif';  // フォントの設定
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

        // テキストを描画
        let textHeight = finalText ? textCenter - lineSpacing : textCenter + baseFontSize / 2; // 2行目テキストがある場合は上に、ない場合は中央にずらす
        ctx.fillText(text1, textStart, textHeight);
        ctx.font = '900 ' + baseFontSize + 'px sans-serif';  // フォントの設定を変更
        ctx.fillStyle = '#000000';  // 文字色
        ctx.fillText(text2, textStart + text1Width, textHeight);
        ctx.font = '600 ' + baseFontSize + 'px sans-serif';  // フォントの設定を戻す
        ctx.fillText(text3, textStart + text1Width + text2Width, textHeight);

        ctx.textAlign = 'center';  // 水平中央揃え
        ctx.font = '400 ' + baseFontSize * 0.8 + 'px sans-serif';  // フォントの設定
        ctx.fillStyle = '#747474';  // 文字色
        ctx.fillText(finalText, canvas.width / 2, textCenter + lineSpacing + baseFontSize);

        let result = canvas.toDataURL();
        
        if (result === "data:,") {
            alert ("フレームの生成に失敗しました。\n画像の縦幅、横幅を小さくして試してみてください。");
            return;
        }

        resultImage.src = result;
    }

    function displayContents(exifData) {
        contentsDiv.style.display = 'block';
    }
}
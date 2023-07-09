window.onload = function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const fileInput = document.getElementById('upload');
    const downloadBtn = document.getElementById('download');
    const resultImage = document.getElementById('resultImage');
    let img = new Image();

    fileInput.addEventListener('change', function(e) {
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.onloadend = function() {
            img.onload = function() {
                EXIF.getData(img, function() {
                    let allMetaData = EXIF.getAllTags(this);
                    console.log(allMetaData);
                });

                let margin = 150;  // 余白の大きさ
                let bottomMargin = 900;  // 下部の余白の大きさ
                let fontSize = 110

                // キャンバスサイズを画像サイズ＋枠分に設定
                canvas.width = img.width + margin * 2;
                canvas.height = img.height + bottomMargin;

                // 白い背景を描画
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 画像を描画（余白の分だけずらして描画）
                ctx.drawImage(img, margin, margin, img.width, img.height);

                // テキストを描画（下部の余白に）
                ctx.fillStyle = '#747474';  // 文字色
                ctx.font = '400 ' + fontSize + 'px sans-serif';  // フォントの設定
                // ctx.textAlign = 'center';  // 水平中央揃え
                ctx.textBaseline = 'middle';  // 垂直中央揃え
                let lineSpacing = 20;  // 行間
                let textCenter = canvas.height - bottomMargin / 2 // 下の余白の中央位置

                // 一部のテキストを太字にするための準備
                let text1 = 'Shot on ';
                let text2 = 'X-T2  ';
                let text3 = 'FUJIFILM';
                let text1Width = ctx.measureText(text1).width;
                let text2Width = ctx.measureText(text2).width;
                let textStart = canvas.width / 2 - (text1Width + text2Width + ctx.measureText(text3).width) / 2;

                // テキストを描画
                ctx.fillText(text1, textStart, textCenter - lineSpacing);
                ctx.font = '900 ' + fontSize + 'px sans-serif';  // フォントの設定を変更
                ctx.fillStyle = '#000000';  // 文字色
                ctx.fillText(text2, textStart + text1Width, textCenter - lineSpacing);
                ctx.font = '700 ' + fontSize + 'px sans-serif';  // フォントの設定を戻す
                ctx.fillText(text3, textStart + text1Width + text2Width, textCenter - lineSpacing);

                ctx.textAlign = 'center';  // 水平中央揃え
                ctx.font = '400 ' + fontSize * 0.8 + 'px sans-serif';  // フォントの設定
                ctx.fillStyle = '#747474';  // 文字色
                ctx.fillText('53mm f/1.4 1/3500s ISO800', canvas.width / 2, textCenter + lineSpacing + fontSize);

                resultImage.src = canvas.toDataURL();
            }
            img.src = reader.result;
        }

        if (file) {
            reader.readAsDataURL(file);
        }
    }, false);

    downloadBtn.addEventListener('click', function() {
        // aタグを作成してclickイベントを発生させることで、キャンバス内容を画像としてダウンロード
        let a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'image.png';
        a.click();
    });
}
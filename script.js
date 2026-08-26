const GAS_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbxBYZePDya15geORvzS-Cw5JU2XaEDth1FvZNZvwop1Asp8MXc0Au_4mwAI7nP85eIZ/exec";

let idToken = "";


/*
 * Googleログイン完了時
 */
function onGoogleLogin(response) {
    idToken = response.credential;

    fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "verifyToken",
            token: idToken
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById("email").value = data.email;
            document.getElementById("name").value = data.realName;
            document.getElementById("user-info").value =
                `学年:${data.grade} ` +
                `クラス:${data.clazz} ` +
                `出席番号:${data.number} ` +
                `氏名:${data.realName} ` +
                `学籍番号:${data.studentId}`;
        } else {
            alert(
                "Google認証エラー\n" +
                data.error
            );
        }
    })
    .catch(() => {
        alert("通信エラーが発生しました");
    });
}


/*
 * 登録ボタン
 */
function sendData() {
    if (!idToken) {
        alert("Googleログインしてください");
        return;
    }

    document.getElementById("form-container").style.display = "none";
    document.getElementById("waiting-container").style.display = "block";

    fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "submitForm",
            token: idToken
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            pollForTunnelUrl(data.row);
        } else {
            alert(data.error);
            location.reload();
        }
    })
    .catch(() => {
        alert("通信エラー");
        location.reload();
    });
}


/*
 * ラズパイ側のURL発行完了を確認
 */
function pollForTunnelUrl(rowNumber) {
    const timer = setInterval(() => {
        fetch(GAS_WEB_APP_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "checkStatus",
                token: idToken,
                row: rowNumber
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ready) {
                clearInterval(timer);

                document.getElementById("stream-link").href =
                    data.tunnel_url;

                document.getElementById("waiting-container").style.display =
                    "none";

                document.getElementById("success-container").style.display =
                    "block";
            }
        })
        .catch(() => {
            console.log("確認中...");
        });
    }, 3000);
}

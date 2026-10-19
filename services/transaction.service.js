// URL base da API. Em produção, troque pela URL do back-end publicado.
const API_URL = "https://controle-de-gastos-backend.onrender.com";

const transactionService = {
    findByUser: () => {
        return callApi({
            method: "GET",
            url: `${API_URL}/transactions`
        })
    },
    findByUid: uid => {
        return callApi({
            method: "GET",
            url: `${API_URL}/transactions/${uid}`
        })
    },
    remove: transaction => {
        return callApi({
            method: "DELETE",
            url: `${API_URL}/transactions/${transaction.uid}`
        })
    },
    save: transaction => {
        return callApi({
            method: "POST",
            url: `${API_URL}/transactions`,
            params: transaction
        })
    },
    update: transaction => {
        return callApi({
            method: "PATCH",
            url: `${API_URL}/transactions/${transaction.uid}`,
            params: transaction
        })
    }
}

async function callApi({method, url, params}) {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw {code: 401, message: "Usuário não autenticado"};
    }

    const request = async forceRefresh => {
        // getIdToken() renova sozinho se estiver perto de expirar; true força a renovação
        const token = await user.getIdToken(forceRefresh);

        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json;charset=UTF-8"
            },
            body: params ? JSON.stringify(params) : undefined
        });

        let body = null;
        try {
            body = await response.json();
        } catch (e) {
            // resposta sem corpo JSON
        }
        return {response, body};
    };

    let {response, body} = await request(false);

    // Token recusado: tenta uma vez com token novo antes de desistir
    if (response.status === 401) {
        ({response, body} = await request(true));
    }

    if (response.status === 401) {
        await firebase.auth().signOut(); // o auth-guard.js redireciona para o login
    }

    if (!response.ok) {
        throw body || {code: response.status, message: "Erro ao chamar a API"};
    }
    return body;
}

// Importe as funções necessárias dos SDKs do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Sua configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD70Uto5Z8gAHclBNm9peW7FKd4pR1-sZA",
    authDomain: "clickmoz-e7e6b.firebaseapp.com",
    projectId: "clickmoz-e7e6b",
    storageBucket: "clickmoz-e7e6b.appspot.com",
    messagingSenderId: "57111705800",
    appId: "1:57111705800:web:6ff95f2ce510c0c09f8dfd"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Função para validar prefixo telefônico
function validarPrefixo(telefone) {
    const prefixosValidos = ['82','83','84','85','86','87'];
    return prefixosValidos.some(prefixo => telefone.startsWith(prefixo));
}

// Mostrar/ocultar modais
const modalLogin = document.getElementById('modalLogin');
const modalCadastro = document.getElementById('modalCadastro');
const btnLogin = document.getElementById('btnLogin');
const btnCadastro = document.getElementById('btnCadastro');
const closeLogin = document.getElementById('closeLogin');
const closeCadastro = document.getElementById('closeCadastro');

btnLogin.onclick = () => {
    modalLogin.style.display = 'flex';
    modalCadastro.style.display = 'none';
    limparErros();
    limparForms();
};
btnCadastro.onclick = () => {
    modalCadastro.style.display = 'flex';
    modalLogin.style.display = 'none';
    limparErros();
    limparForms();
};
closeLogin.onclick = () => modalLogin.style.display = 'none';
closeCadastro.onclick = () => modalCadastro.style.display = 'none';

// Alternar entre modais
document.getElementById('abrirCadastro').onclick = () => {
    modalLogin.style.display = 'none';
    modalCadastro.style.display = 'flex';
    limparErros();
    limparForms();
};
document.getElementById('abrirLogin').onclick = () => {
    modalCadastro.style.display = 'none';
    modalLogin.style.display = 'flex';
    limparErros();
    limparForms();
};

// Fechar modal ao clicar fora do conteúdo
window.onclick = (event) => {
    if(event.target === modalLogin) modalLogin.style.display = 'none';
    if(event.target === modalCadastro) modalCadastro.style.display = 'none';
};

// Limpar mensagens de erro
function limparErros() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}
// Limpar inputs dos formulários
function limparForms() {
    document.querySelectorAll('form').forEach(form => form.reset());
}

// Função para ativar/desativar botão e spinner
function setLoading(button, loading) {
    if(loading) {
        button.disabled = true;
        button.innerHTML = button.textContent + '<span class="spinner"></span>';
    } else {
        button.disabled = false;
        button.innerHTML = button.textContent.replace(/<span class="spinner"><\/span>/g, '');
    }
}

// LOGIN
document.getElementById('formLogin').addEventListener('submit', async function(e){
    e.preventDefault();
    limparErros();

    const telefone = document.getElementById('loginTelefone').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');

    let valid = true;

    if(telefone.length !== 9){
        document.getElementById('errorLoginTelefone').textContent = 'Telefone deve ter 9 dígitos.';
        valid = false;
    } else if(!validarPrefixo(telefone)){
        document.getElementById('errorLoginTelefone').textContent = 'Prefixo inválido. Use 82,83,84,85,86 ou 87.';
        valid = false;
    }

    if(senha.length < 6){
        document.getElementById('errorLoginSenha').textContent = 'Senha deve ter no mínimo 6 caracteres.';
        valid = false;
    }

    if(!valid) return;

    try {
        setLoading(btnSubmitLogin, true);
        const email = telefone + '@clickmoz.fake';
        await signInWithEmailAndPassword(auth, email, senha);
        alert('Login efetuado com sucesso!');
        modalLogin.style.display = 'none';
        window.location.href = 'painel.html';
    } catch (error) {
        if(error.code === 'auth/user-not-found'){
            document.getElementById('errorLoginSenha').textContent = 'Usuário não encontrado.';
        } else if(error.code === 'auth/wrong-password'){
            document.getElementById('errorLoginSenha').textContent = 'Senha incorreta.';
        } else {
            document.getElementById('errorLoginSenha').textContent = 'Erro no login: ' + error.message;
        }
    } finally {
        setLoading(btnSubmitLogin, false);
    }
});

// CADASTRO
document.getElementById('formCadastro').addEventListener('submit', async function(e){
    e.preventDefault();
    limparErros();

    const nome = document.getElementById('nome').value.trim();
    const sobrenome = document.getElementById('sobrenome').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const senha = document.getElementById('senha').value.trim();
    const btnSubmitCadastro = document.getElementById('btnSubmitCadastro');

    let valid = true;

    if(nome.length < 4){
        document.getElementById('errorNome').textContent = 'Nome deve ter no mínimo 4 caracteres.';
        valid = false;
    }
    if(sobrenome.length < 4){
        document.getElementById('errorSobrenome').textContent = 'Sobrenome deve ter no mínimo 4 caracteres.';
        valid = false;
    }
    if(telefone.length !== 9){
        document.getElementById('errorTelefone').textContent = 'Telefone deve ter 9 dígitos.';
        valid = false;
    } else if(!validarPrefixo(telefone)){
        document.getElementById('errorTelefone').textContent = 'Prefixo inválido. Use 82,83,84,85,86 ou 87.';
        valid = false;
    }
    if(senha.length < 6){
        document.getElementById('errorSenha').textContent = 'Senha deve ter no mínimo 6 caracteres.';
        valid = false;
    }

    if(!valid) return;

    try {
        setLoading(btnSubmitCadastro, true);
        const email = telefone + '@clickmoz.fake';
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        await setDoc(doc(db, "usuarios", user.uid), {
            nome,
            sobrenome,
            telefone,
            saldo: 0
        });
        alert('Cadastro realizado com sucesso!');
        modalCadastro.style.display = 'none';
        window.location.href = 'painel.html';
    } catch (error) {
        if(error.code === 'auth/email-already-in-use'){
            document.getElementById('errorTelefone').textContent = 'Este número já está cadastrado.';
        } else {
            document.getElementById('errorSenha').textContent = 'Erro no cadastro: ' + error.message;
        }
    } finally {
        setLoading(btnSubmitCadastro, false);
    }
});

// Esqueceu senha
document.getElementById('esqueceuSenha').onclick = () => {
    const telefone = prompt('Digite seu número de telefone para receber o link de recuperação (9 dígitos):');
    if(!telefone) return alert('Número não informado');
    if(telefone.length !== 9 || !validarPrefixo(telefone)) {
        return alert('Número inválido. Use prefixos 82,83,84,85,86 ou 87 e 9 dígitos.');
    }
    const email = telefone + '@clickmoz.fake';
    sendPasswordResetEmail(auth, email)
        .then(() => alert('Email de redefinição enviado! Verifique sua caixa de entrada.'))
        .catch(err => alert('Erro: ' + err.message));
};

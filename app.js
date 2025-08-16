import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, addDoc, orderBy, serverTimestamp, getCountFromServer } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase Config (Mantenha a sua configuração original)
const firebaseConfig = {
    apiKey: "AIzaSyD70Uto5Z8gAHclBNm9peW7FKd4pR1-sZA",
    authDomain: "clickmoz-e7e6b.firebaseapp.com",
    projectId: "clickmoz-e7e6b",
    storageBucket: "clickmoz-e7e6b.firebasestorage.app",
    messagingSenderId: "57111705800",
    appId: "1:57111705800:web:6ff95f2ce510c0c09f8dfd",
    measurementId: "G-GBLYFL5WNM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sections = document.querySelectorAll('section');
const menuLinks = document.querySelectorAll('.sidebar a');
const latestTransactionsList = document.getElementById('latestTransactions');

// State
let currentUser;

// --- UTILITY FUNCTIONS ---
const showSection = (id, element) => {
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    menuLinks.forEach(link => link.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
    
    // Call the specific load function for the section
    if (id === 'tarefas') loadTasks();
    if (id === 'levantamentos') loadWithdrawals();
    if (id === 'transacoes') loadTransactions();
    if (id === 'suporte') loadSupportTickets();
    if (id === 'notificacoes') loadNotifications();
};

const toggleSidebar = () => {
    sidebar.classList.toggle('open');
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'Data indisponível';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
};

const showLoading = (elementId) => {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Carregando...</p></div>`;
};

// --- DATA LOADING FUNCTIONS ---
const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
        const uid = currentUser.uid;
        const userDoc = await getDoc(doc(db, "users", uid));

        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('userSaldo').innerText = `${data.saldo?.toFixed(2) || "0.00"} MT`;
            
            const q = query(collection(db, "tasks_completed"), where("userId", "==", uid));
            const completedTasks = await getCountFromServer(q);
            document.getElementById('tasksCompleted').innerText = completedTasks.data().count;

            document.getElementById('referralCount').innerText = data.indicacoes || 0;
            document.getElementById('referralCountDisplay').innerText = data.indicacoes || 0;
            document.getElementById('referralLink').value = `https://clickmoz.com/register?ref=${uid}`; // Exemplo de link de indicação
        }
        
        // Load latest transactions for dashboard
        const transacoesSnap = await getDocs(query(
            collection(db, "transactions"),
            where("userId", "==", uid),
            orderBy("data", "desc"),
            limit(5)
        ));

        if (transacoesSnap.empty) {
            latestTransactionsList.innerText = "Nenhuma transação recente.";
        } else {
            let html = '';
            transacoesSnap.forEach(doc => {
                const t = doc.data();
                html += `
                    <div class="card" style="margin-bottom: 10px;">
                        <p><strong>Tipo:</strong> ${t.tipo || "Desconhecido"}</p>
                        <p><strong>Valor:</strong> ${t.valor || 0} MT</p>
                        <p><strong>Data:</strong> ${formatDate(t.data)}</p>
                        <p><strong>Status:</strong> ${t.status || "pendente"}</p>
                    </div>
                `;
            });
            latestTransactionsList.innerHTML = html;
        }

    } catch (e) {
        console.error("Erro ao carregar dados do dashboard: ", e);
        alert("Erro ao carregar dados. Tente novamente.");
    }
};

const loadTasks = async () => {
    showLoading('taskList');
    try {
        const tasksSnap = await getDocs(query(collection(db, "tasks"), where("approved", "==", true)));
        const taskList = document.getElementById("taskList");
        taskList.innerHTML = "";
        if (tasksSnap.empty) {
            taskList.innerHTML = '<p>Nenhuma tarefa disponível no momento.</p>';
        } else {
            tasksSnap.forEach(doc => {
                const task = doc.data();
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <h3>${task.titulo}</h3>
                    <p>${task.descricao || "Sem descrição"}</p>
                    <p><strong>Valor:</strong> ${task.valor?.toFixed(2) || "0.00"} MT</p>
                    <button class="btn-submit" style="background-color: #4CAF50;">Concluir Tarefa</button>
                `;
                taskList.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar tarefas: ", e);
        document.getElementById("taskList").innerHTML = '<p>Erro ao carregar tarefas. Tente novamente.</p>';
    }
};

const loadTransactions = async () => {
    showLoading('transacoesList');
    if (!currentUser) return;
    try {
        const transacoesSnap = await getDocs(query(
            collection(db, "transactions"),
            where("userId", "==", currentUser.uid),
            orderBy("data", "desc")
        ));
        const transacoesList = document.getElementById("transacoesList");
        if (transacoesSnap.empty) {
            transacoesList.innerText = "Nenhuma transação.";
        } else {
            transacoesList.innerHTML = "";
            transacoesSnap.forEach(doc => {
                const t = doc.data();
                const div = document.createElement("div");
                div.className = "card";
                div.innerHTML = `
                    <p><strong>Tipo:</strong> ${t.tipo || "Desconhecido"}</p>
                    <p><strong>Valor:</strong> ${t.valor?.toFixed(2) || "0.00"} MT</p>
                    <p><strong>Data:</strong> ${formatDate(t.data)}</p>
                    <p><strong>Status:</strong> ${t.status || "pendente"}</p>
                `;
                transacoesList.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar transações: ", e);
        document.getElementById("transacoesList").innerHTML = '<p>Erro ao carregar transações. Tente novamente.</p>';
    }
};

const loadWithdrawals = async () => {
    showLoading('levantamentosList');
    if (!currentUser) return;
    try {
        const levantamentosSnap = await getDocs(query(
            collection(db, "withdrawals"),
            where("userId", "==", currentUser.uid),
            orderBy("data", "desc")
        ));
        const levantamentosList = document.getElementById("levantamentosList");
        if (levantamentosSnap.empty) {
            levantamentosList.innerText = "Nenhum pedido de levantamento.";
        } else {
            levantamentosList.innerHTML = "";
            levantamentosSnap.forEach(doc => {
                const w = doc.data();
                const div = document.createElement("div");
                div.className = "card";
                div.innerHTML = `
                    <p><strong>Valor:</strong> ${w.valor?.toFixed(2) || "0.00"} MT</p>
                    <p><strong>Método:</strong> ${w.metodo || "Não especificado"}</p>
                    <p><strong>Data:</strong> ${formatDate(w.data)}</p>
                    <p><strong>Status:</strong> ${w.status || "pendente"}</p>
                `;
                levantamentosList.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar levantamentos: ", e);
        document.getElementById("levantamentosList").innerHTML = '<p>Erro ao carregar levantamentos. Tente novamente.</p>';
    }
};

const loadNotifications = async () => {
    showLoading('notificacoesList');
    if (!currentUser) return;
    try {
        const notifsSnap = await getDocs(query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.uid),
            orderBy("data", "desc")
        ));
        const notificacoesList = document.getElementById("notificacoesList");
        if (notifsSnap.empty) {
            notificacoesList.innerText = "Nenhuma notificação.";
        } else {
            notificacoesList.innerHTML = "";
            notifsSnap.forEach(doc => {
                const n = doc.data();
                const div = document.createElement("div");
                div.className = "card";
                div.innerHTML = `
                    <p>${n.mensagem || ""}</p>
                    <small>${formatDate(n.data)}</small>
                `;
                notificacoesList.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar notificações: ", e);
        document.getElementById("notificacoesList").innerHTML = '<p>Erro ao carregar notificações. Tente novamente.</p>';
    }
};

const loadSupportTickets = async () => {
    showLoading('suporteList');
    if (!currentUser) return;
    try {
        const suporteSnap = await getDocs(query(
            collection(db, "supportTickets"),
            where("userId", "==", currentUser.uid),
            orderBy("data", "desc")
        ));
        const suporteList = document.getElementById("suporteList");
        if (suporteSnap.empty) {
            suporteList.innerText = "Nenhum ticket de suporte.";
        } else {
            suporteList.innerHTML = "";
            suporteSnap.forEach(doc => {
                const s = doc.data();
                const div = document.createElement("div");
                div.className = "card";
                div.innerHTML = `
                    <p><strong>Assunto:</strong> ${s.assunto || "Sem assunto"}</p>
                    <p>${s.mensagem || ""}</p>
                    <p><strong>Status:</strong> ${s.status || "pendente"}</p>
                    <small>${formatDate(s.data)}</small>
                `;
                suporteList.appendChild(div);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar tickets de suporte: ", e);
        document.getElementById("suporteList").innerHTML = '<p>Erro ao carregar tickets de suporte. Tente novamente.</p>';
    }
};

// --- FORM SUBMISSION LOGIC ---
document.getElementById('withdrawalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Por favor, faça login.");
    
    const valor = parseFloat(document.getElementById('withdrawalAmount').value);
    const metodo = document.getElementById('withdrawalMethod').value;
    const conta = document.getElementById('withdrawalAccount').value;
    
    if (isNaN(valor) || valor <= 0) {
        return alert("Por favor, digite um valor válido.");
    }

    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
            return alert("Usuário não encontrado.");
        }
        const saldoAtual = userDoc.data().saldo || 0;
        
        if (valor > saldoAtual) {
            return alert("Saldo insuficiente para este levantamento.");
        }
        
        await addDoc(collection(db, "withdrawals"), {
            userId: currentUser.uid,
            valor: valor,
            metodo: metodo,
            conta: conta,
            status: "pendente",
            data: serverTimestamp()
        });
        
        alert("Pedido de levantamento enviado com sucesso!");
        document.getElementById('withdrawalForm').reset();
        loadWithdrawals();
        loadDashboardData();
    } catch (e) {
        console.error("Erro ao enviar pedido de levantamento: ", e);
        alert("Erro ao enviar o pedido. Tente novamente.");
    }
});

document.getElementById('supportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Por favor, faça login.");
    
    const assunto = document.getElementById('ticketSubject').value;
    const mensagem = document.getElementById('ticketMessage').value;
    
    try {
        await addDoc(collection(db, "supportTickets"), {
            userId: currentUser.uid,
            assunto: assunto,
            mensagem: mensagem,
            status: "pendente",
            data: serverTimestamp()
        });
        
        alert("Ticket de suporte enviado com sucesso!");
        document.getElementById('supportForm').reset();
        loadSupportTickets();
    } catch (e) {
        console.error("Erro ao enviar ticket de suporte: ", e);
        alert("Erro ao enviar o ticket. Tente novamente.");
    }
});


// --- INITIALIZATION AND AUTHENTICATION ---
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUser = user;
        // Load data for the initial dashboard view
        loadDashboardData();
        // Hide loading spinners
        document.querySelectorAll('.loading-spinner').forEach(el => el.style.display = 'none');
    }
});

// Expose functions to the global scope for onclick attributes
window.showSection = showSection;
window.logout = () => signOut(auth).then(() => window.location.href = "login.html");
window.toggleSidebar = toggleSidebar;
window.copyReferralLink = () => {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert("Link de indicação copiado!");
};

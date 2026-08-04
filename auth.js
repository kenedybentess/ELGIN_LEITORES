// Sistema de Autenticação e Permissões - Leitores PRO
// admin = acesso total | operador = somente testes.html

(function(){
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = '123';

    function getOperadores(){
        try { return JSON.parse(localStorage.getItem('operadores')||'[]'); } catch { return []; }
    }

    function getSession(){
        try {
            return {
                logged: sessionStorage.getItem('logged') === 'true',
                role: sessionStorage.getItem('user_role') || '',
                nome: sessionStorage.getItem('user_nome') || '',
                matricula: sessionStorage.getItem('user_matricula') || '',
                id: sessionStorage.getItem('user_id') || ''
            };
        } catch { return {logged:false, role:'', nome:'', matricula:'', id:''}; }
    }

    function saveSession({role, nome, matricula, id}){
        sessionStorage.setItem('logged','true');
        sessionStorage.setItem('user_role', role);
        sessionStorage.setItem('user_nome', nome);
        sessionStorage.setItem('user_matricula', matricula);
        sessionStorage.setItem('user_id', id || matricula);
    }

    function clearSession(){
        sessionStorage.removeItem('logged');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_nome');
        sessionStorage.removeItem('user_matricula');
        sessionStorage.removeItem('user_id');
    }

    function isAdmin(session){
        const s = session || getSession();
        return s.logged && s.role === 'admin';
    }

    function isOperador(session){
        const s = session || getSession();
        return s.logged && s.role === 'operador';
    }

    function tentarLogin(usuario, senha){
        const u = (usuario||'').trim();
        const p = (senha||'').trim();
        if(!u || !p) return {ok:false, msg:'Preencha usuário e senha'};

        // 1 - admin fixo
        if(u.toLowerCase() === ADMIN_USER && p === ADMIN_PASS){
            saveSession({role:'admin', nome:'Administrador', matricula:'ADMIN', id:'admin'});
            return {ok:true, role:'admin'};
        }

        // 2 - operadores cadastrados
        const ops = getOperadores();
        // compat: se operador antigo sem senha, usa matricula como senha padrão
        // perfil: 'admin' ou 'operador' - padrão operador
        let op = ops.find(o => o.matricula.toLowerCase() === u.toLowerCase() && o.status === 'Ativo');
        if(!op){
            // tenta também por nome de usuário se houver campo usuario
            op = ops.find(o => (o.usuario && o.usuario.toLowerCase() === u.toLowerCase()) && o.status === 'Ativo');
        }
        if(op){
            const senhaCorreta = op.senha || op.matricula; // fallback legado
            if(p === senhaCorreta){
                const role = (op.perfil === 'admin') ? 'admin' : 'operador';
                saveSession({role, nome: op.nome, matricula: op.matricula, id: op.id});
                return {ok:true, role};
            } else {
                return {ok:false, msg:'Senha inválida'};
            }
        }

        return {ok:false, msg:'Usuário ou senha inválidos'};
    }

    function requireLogin(){
        const s = getSession();
        if(!s.logged){
            const current = window.location.pathname.split('/').pop() || 'index.html';
            if(current !== 'index.html' && current !== ''){
                // se não estiver no login, volta pro login
                window.location.href = 'index.html';
            }
            return false;
        }
        return true;
    }

    // bloqueia operador em páginas admin
    function requirePermission(){
        const s = getSession();
        if(!s.logged) return requireLogin();
        const pagina = (window.location.pathname.split('/').pop()||'').toLowerCase();
        // operador pode acessar testes e logs (filtrado), mas não dashboard/produtos/operadores/etiquetas/relatorios
        const paginasOperador = ['testes.html', 'logs.html']; 
        const paginasLivres = ['index.html','']; // index trata redirecionamento
        const paginasBloqueadasOperador = ['produtos.html','operadores.html','etiquetas.html','historico.html','relatorios.html','index.html'];

        if(s.role === 'operador'){
            if(paginasLivres.includes(pagina)){
                if(pagina === 'index.html' || pagina === ''){
                    window.location.href = 'testes.html';
                }
                return false;
            }
            if(paginasBloqueadasOperador.includes(pagina)){
                alert('Acesso restrito: operadores só podem acessar Testes e Meus Logs');
                window.location.href = 'testes.html';
                return false;
            }
            if(!paginasOperador.includes(pagina)){
                // qualquer outra pagina desconhecida, bloqueia
                alert('Acesso restrito: operadores só podem acessar a tela de Testes');
                window.location.href = 'testes.html';
                return false;
            }
        }
        return true;
    }

    function aplicarVisualPermissoes(){
        const s = getSession();
        if(!s.logged) return;
        // mostra nome e badge
        const elsNome = document.querySelectorAll('#nomeUsuario, #userName, .user-name-display');
        elsNome.forEach(el=>{
            el.innerHTML = `${s.nome} <span class="badge ${s.role==='admin'?'bg-danger':'bg-success'} ms-2" style="font-size:10px">${s.role.toUpperCase()}</span>`;
        });

        if(s.role === 'operador'){
            // esconde itens de menu admin - sidebar e top-nav (produtos, operadores, dashboard, etiquetas, relatorios, historico)
            document.querySelectorAll('.sidebar a').forEach(a=>{
                const href = (a.getAttribute('href')||'').toLowerCase();
                if(href.includes('produtos.html') || href.includes('operadores.html') || href.includes('historico') || href.includes('relatorios') || href.includes('etiquetas.html') || href.includes('index.html')){
                    const li = a.closest('li');
                    if(li) li.style.display='none';
                    else a.style.display='none';
                }
                if(href.includes('testes.html')){
                    a.classList.add('active');
                }
                // logs.html fica visível como "Meus Testes"
                if(href.includes('logs.html')){
                    a.innerHTML = '<i class="bi bi-person-check"></i> Meus Testes';
                    const li = a.closest('li');
                    if(li) li.style.display='';
                }
            });
            // esconde top-nav em testes.html que leva pra admin (mantém logs)
            document.querySelectorAll('.top-nav a, .menu-dropdown a').forEach(a=>{
                const href=(a.getAttribute('href')||'').toLowerCase();
                if(href.includes('produtos.html') || href.includes('operadores.html') || href.includes('etiquetas.html') || href.includes('historico.html') || href.includes('relatorios.html')){
                    if(document.getElementById('menuDropdown') && a.closest('#menuDropdown')){
                        a.style.display='none';
                    }
                }
                if(href.includes('logs.html')){
                    a.innerHTML = '<i class="bi bi-person-check"></i> Meus Logs';
                    a.style.display='';
                }
            });

            // esconde botões de admin dentro de testes.html se houver
            const btnsAdmin = document.querySelectorAll('[data-admin-only]');
            btnsAdmin.forEach(b=>b.style.display='none');
        }
    }

    function logout(){
        clearSession();
        window.location.href = 'index.html';
    }

    // expõe global
    window.AuthSystem = {
        getSession, isAdmin, isOperador, tentarLogin, requireLogin, requirePermission, aplicarVisualPermissoes, logout, saveSession, clearSession
    };

    // auto-exec em todas as páginas exceto login page quando já gerencia
    document.addEventListener('DOMContentLoaded', ()=>{
        const pagina = (window.location.pathname.split('/').pop()||'').toLowerCase();
        if(pagina !== 'index.html' && pagina !== ''){
            // páginas internas: exige login e permissão
            if(!requireLogin()) return;
            requirePermission();
            aplicarVisualPermissoes();
        }
    });
})();

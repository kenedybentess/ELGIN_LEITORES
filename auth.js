// Sistema de Autenticação e Permissões - Leitores PRO - v2 CORRIGIDO
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
        ['logged','user_role','user_nome','user_matricula','user_id'].forEach(k=>sessionStorage.removeItem(k));
    }

    function tentarLogin(usuario, senha){
        const u = (usuario||'').trim();
        const p = (senha||'').trim();
        if(!u || !p) return {ok:false, msg:'Preencha usuário e senha'};

        if(u.toLowerCase() === ADMIN_USER && p === ADMIN_PASS){
            saveSession({role:'admin', nome:'Administrador', matricula:'ADMIN', id:'admin'});
            return {ok:true, role:'admin'};
        }

        const ops = getOperadores();
        let op = ops.find(o => o.matricula.toLowerCase() === u.toLowerCase() && o.status === 'Ativo');
        if(!op){
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
            const current = (window.location.pathname.split('/').pop()||'').toLowerCase();
            if(current !== 'index.html' && current !== '' ){
                window.location.href = 'index.html';
            }
            return false;
        }
        return true;
    }

    function requirePermission(){
        const s = getSession();
        if(!s.logged) return requireLogin();
        const pagina = (window.location.pathname.split('/').pop()||'').toLowerCase();
        const paginasOperador = ['testes.html', 'logs.html']; 
        const paginasLivres = ['index.html',''];
        const paginasBloqueadasOperador = ['produtos.html','operadores.html','etiquetas.html','historico.html','relatorios.html'];

        if(s.role === 'operador'){
            if(paginasLivres.includes(pagina)){
                window.location.href = 'testes.html';
                return false;
            }
            if(paginasBloqueadasOperador.includes(pagina) || !paginasOperador.includes(pagina)){
                alert('Acesso restrito: operadores só podem acessar Testes e Meus Logs');
                window.location.href = 'testes.html';
                return false;
            }
        }
        return true;
    }

    function aplicarVisualPermissoes(){
        const s = getSession();
        if(!s.logged) return;
        document.querySelectorAll('#nomeUsuario, #userName, .user-name-display, #nomeUsuarioTeste').forEach(el=>{
            el.innerHTML = `${escapeHtml(s.nome)} <span class="badge ${s.role==='admin'?'bg-danger':'bg-success'} ms-2" style="font-size:10px">${s.role.toUpperCase()}</span>`;
        });
        if(s.role === 'operador'){
            document.querySelectorAll('.sidebar a').forEach(a=>{
                const href = (a.getAttribute('href')||'').toLowerCase();
                if(href.includes('produtos.html') || href.includes('operadores.html') || href.includes('historico') || href.includes('relatorios') || href.includes('etiquetas.html')){
                    const li = a.closest('li'); if(li) li.style.display='none'; else a.style.display='none';
                }
            });
            document.querySelectorAll('[data-admin-only]').forEach(b=>b.style.display='none');
        }
    }

    function escapeHtml(str){
        return (str||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function logout(){ clearSession(); window.location.href = 'index.html'; }

    window.AuthSystem = { getSession, tentarLogin, requireLogin, requirePermission, aplicarVisualPermissoes, logout, saveSession, clearSession };
    
    document.addEventListener('DOMContentLoaded', ()=>{
        const pagina = (window.location.pathname.split('/').pop()||'').toLowerCase();
        if(pagina !== 'index.html' && pagina !== ''){
            if(!requireLogin()) return;
            requirePermission();
            aplicarVisualPermissoes();
        } else {
            // se já logado no index, mostra app
            const s = getSession();
            if(s.logged && document.getElementById('loginPage')){
                if(s.role==='operador'){
                    window.location.href='testes.html';
                }
            }
        }
    });
})();

// Auth v8 - OFFLINE TOTAL - funciona 100% sem internet
(function(){
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = '123';

    // Garante que operadores padrão existe SINCRONO, antes de tudo
    (function garanteAdminOffline(){
        try{
            let ops = localStorage.getItem('operadores');
            if(!ops || ops==='[]'){
                const adminPadrao = [{id:'1',matricula:'ADMIN',nome:'Administrador',usuario:'admin',senha:'123',perfil:'admin',turno:'Administrativo',status:'Ativo'}];
                localStorage.setItem('operadores', JSON.stringify(adminPadrao));
            }
            if(!localStorage.getItem('produtos')) localStorage.setItem('produtos','[]');
            if(!localStorage.getItem('testes')) localStorage.setItem('testes','[]');
            if(!localStorage.getItem('logs_evidencia')) localStorage.setItem('logs_evidencia','[]');
        }catch(e){ console.log('storage fail',e); }
    })();

    function getOperadores(){
        try { return JSON.parse(localStorage.getItem('operadores')||'[]'); } catch { return []; }
    }

    function getSession(){
        try {
            // tenta sessionStorage, fallback localStorage para offline persistente
            let logged = sessionStorage.getItem('logged') || localStorage.getItem('session_logged');
            return {
                logged: logged === 'true',
                role: sessionStorage.getItem('user_role') || localStorage.getItem('session_role') || '',
                nome: sessionStorage.getItem('user_nome') || localStorage.getItem('session_nome') || '',
                matricula: sessionStorage.getItem('user_matricula') || localStorage.getItem('session_matricula') || '',
                id: sessionStorage.getItem('user_id') || localStorage.getItem('session_id') || ''
            };
        } catch { return {logged:false, role:'', nome:'', matricula:'', id:''}; }
    }

    function saveSession({role, nome, matricula, id}){
        try{
            sessionStorage.setItem('logged','true');
            sessionStorage.setItem('user_role', role);
            sessionStorage.setItem('user_nome', nome);
            sessionStorage.setItem('user_matricula', matricula);
            sessionStorage.setItem('user_id', id || matricula);
            // backup offline em localStorage
            localStorage.setItem('session_logged','true');
            localStorage.setItem('session_role', role);
            localStorage.setItem('session_nome', nome);
            localStorage.setItem('session_matricula', matricula);
            localStorage.setItem('session_id', id || matricula);
        }catch(e){}
    }

    function clearSession(){
        try{
            ['logged','user_role','user_nome','user_matricula','user_id'].forEach(k=>sessionStorage.removeItem(k));
            ['session_logged','session_role','session_nome','session_matricula','session_id'].forEach(k=>localStorage.removeItem(k));
        }catch{}
    }

    function tentarLogin(usuario, senha){
        const u = (usuario||'').trim();
        const p = (senha||'').trim();
        if(!u || !p) return {ok:false, msg:'Preencha usuário e senha'};

        // ADMIN FIXO - funciona sempre offline
        if(u.toLowerCase() === ADMIN_USER && p === ADMIN_PASS){
            saveSession({role:'admin', nome:'Administrador', matricula:'ADMIN', id:'admin'});
            return {ok:true, role:'admin'};
        }

        const ops = getOperadores();
        let op = ops.find(o => (o.matricula && o.matricula.toLowerCase() === u.toLowerCase()) && o.status === 'Ativo');
        if(!op){
            op = ops.find(o => (o.usuario && o.usuario.toLowerCase() === u.toLowerCase()) && o.status === 'Ativo');
        }
        if(op){
            const senhaCorreta = op.senha || op.matricula;
            if(p === senhaCorreta){
                const role = (op.perfil === 'admin') ? 'admin' : 'operador';
                saveSession({role, nome: op.nome, matricula: op.matricula, id: op.id});
                return {ok:true, role};
            } else {
                return {ok:false, msg:'Senha inválida'};
            }
        }
        return {ok:false, msg:'Usuário ou senha inválidos - verifique se está cadastrado. Dica offline: admin/123'};
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
        const paginasBloqueadasOperador = ['produtos.html','operadores.html','etiquetas.html','historico.html','relatorios.html'];
        if(s.role === 'operador'){
            if(pagina==='index.html' || pagina===''){
                window.location.href='testes.html';
                return false;
            }
            if(paginasBloqueadasOperador.includes(pagina)){
                alert('Acesso restrito: operadores só podem acessar Testes');
                window.location.href='testes.html';
                return false;
            }
        }
        return true;
    }

    function aplicarVisualPermissoes(){
        const s = getSession();
        if(!s.logged) return;
        document.querySelectorAll('#nomeUsuario, #userName, .user-name-display, #nomeUsuarioTeste').forEach(el=>{
            if(el) el.innerHTML = `${escapeHtml(s.nome)} <span class="badge ${s.role==='admin'?'bg-danger':'bg-success'} ms-2" style="font-size:10px">${s.role.toUpperCase()}</span> <small class="badge bg-secondary ms-1">${navigator.onLine?'🌐':'📴'}</small>`;
        });
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
            const s = getSession();
            if(s.logged && document.getElementById('loginPage')){
                if(s.role==='operador'){
                    window.location.href='testes.html';
                }
            }
        }
    });
})();

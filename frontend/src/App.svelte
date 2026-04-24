<script>
  import { onMount } from 'svelte'
  import { user } from './store.js'
  import Login from './components/Login.svelte'
  import Dashboard from './components/Dashboard.svelte'
  import FieldList from './components/FieldList.svelte'
  import FieldDetail from './components/FieldDetail.svelte'
  
  let currentPage = 'dashboard'
  let selectedFieldId = null
  
  function parseUrl() {
    const path = window.location.pathname
    if (path.startsWith('/fields/')) {
      const id = path.split('/fields/')[1]
      if (id && !isNaN(id)) {
        currentPage = 'field-detail'
        selectedFieldId = parseInt(id)
      } else {
        currentPage = 'fields'
      }
    } else if (path === '/fields') {
      currentPage = 'fields'
    } else {
      currentPage = 'dashboard'
    }
  }
  
  onMount(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      user.set(JSON.parse(savedUser))
    }
    parseUrl()
  })
  
  function navigate(page, fieldId = null) {
    currentPage = page
    selectedFieldId = fieldId
    
    let url = '/'
    if (page === 'fields') url = '/fields'
    if (page === 'field-detail' && fieldId) url = `/fields/${fieldId}`
    window.history.pushState({}, '', url)
  }
  
  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    user.set(null)
    currentPage = 'dashboard'
    window.history.pushState({}, '', '/')
  }
  
  window.onpopstate = parseUrl
</script>

{#if !$user}
  <Login />
{:else}
  <div class="app">
    <nav class="navbar">
      <div class="nav-brand">🌾 CropTracker</div>
      <div class="nav-links">
        <button class="nav-btn" on:click={() => navigate('dashboard')}>Dashboard</button>
        <button class="nav-btn" on:click={() => navigate('fields')}>Fields</button>
        <span class="user-pill">
          {$user.username}
          <span class="role">{$user.role}</span>
        </span>
        <button class="nav-btn logout" on:click={logout}>Logout</button>
      </div>
    </nav>
    
    <main class="container">
      {#if currentPage === 'dashboard'}
        <Dashboard on:navigate={(e) => navigate(e.detail.page, e.detail.id)} />
      {:else if currentPage === 'fields'}
        <FieldList on:navigate={(e) => navigate(e.detail.page, e.detail.id)} />
      {:else if currentPage === 'field-detail'}
        <FieldDetail fieldId={selectedFieldId} on:navigate={(e) => navigate(e.detail.page, e.detail.id)} />
      {/if}
    </main>
  </div>
{/if}

<style>
  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f1f5f9; color: #1e293b; line-height: 1.5;
  }
  .navbar {
    background: #166534; color: white; padding: 0 2rem; height: 64px;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-brand { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; }
  .nav-links { display: flex; gap: 0.5rem; align-items: center; }
  .nav-btn {
    background: rgba(255,255,255,0.1); border: none; color: white;
    padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;
    font-size: 0.9rem; font-weight: 500; transition: all 0.2s;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.2); transform: translateY(-1px); }
  .logout { background: #dc2626; }
  .logout:hover { background: #b91c1c; }
  .user-pill {
    background: rgba(255,255,255,0.15); padding: 0.375rem 0.875rem;
    border-radius: 9999px; font-size: 0.85rem; font-weight: 500;
    margin-left: 0.5rem; display: flex; align-items: center; gap: 0.5rem;
  }
  .role {
    background: rgba(255,255,255,0.2); padding: 0.125rem 0.5rem;
    border-radius: 4px; font-size: 0.75rem; text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
</style>
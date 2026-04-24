<script>
  import { onMount } from 'svelte';
  import { user } from './store.js';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import FieldList from './components/FieldList.svelte';
  import FieldDetail from './components/FieldDetail.svelte';
  
  let currentPage = 'dashboard';
  let selectedFieldId = null;
  
  onMount(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        user.set(JSON.parse(savedUser));
      } catch (err) {
        console.error('Invalid saved user in localStorage:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        user.set(null);
      }
    }
  });
  
  function navigate(page, fieldId = null) {
    currentPage = page;
    selectedFieldId = fieldId;
  }
  
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    user.set(null);
  }
</script>

{#if !$user}
  <Login />
{:else}
  <div class="app">
    <nav class="navbar">
      <div class="nav-brand">CropTracker</div>
      <div class="nav-links">
        <button class="nav-btn" on:click={() => navigate('dashboard')}>Dashboard</button>
        <button class="nav-btn" on:click={() => navigate('fields')}>Fields</button>
        <span class="user-info">{$user.username} ({$user.role})</span>
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
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f7fa;
    color: #2d3748;
  }
  
  .navbar {
    background: #2f855a;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .nav-links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .nav-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .nav-btn:hover {
    background: rgba(255,255,255,0.3);
  }
  
  .logout {
    background: #c53030;
  }
  
  .user-info {
    font-size: 0.85rem;
    opacity: 0.9;
    margin-left: 1rem;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
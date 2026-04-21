<script>
  import { user } from '../stores.js';
  import { api } from '../api.js';
  
  let username = '';
  let password = '';
  let error = '';
  let loading = false;
  
  async function handleLogin() {
    loading = true;
    error = '';
    try {
      const data = await api.login({ username, password });
      if (data.error) throw new Error(data.error);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      user.set(data.user);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>CropTracker</h1>
    <p class="subtitle">Field Management System</p>
    
    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label>Username</label>
        <input type="text" bind:value={username} required placeholder="admin or agent1" />
      </div>
      
      <div class="form-group">
        <label>Password</label>
        <input type="password" bind:value={password} required placeholder="admin123 or agent123" />
      </div>
      
      {#if error}
        <div class="error">{error}</div>
      {/if}
      
      <button type="submit" class="btn-primary" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
    
    <div class="demo-info">
      <p><strong>Demo Credentials:</strong></p>
      <p>Admin: admin / admin123</p>
      <p>Agent: agent1 / agent123</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .login-card {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    width: 100%;
    max-width: 400px;
  }
  
  h1 {
    color: #2d3748;
    margin-bottom: 0.5rem;
    text-align: center;
  }
  
  .subtitle {
    color: #718096;
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #4a5568;
    font-size: 0.9rem;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: #2f855a;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .btn-primary:hover {
    background: #276749;
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .error {
    color: #c53030;
    background: #fed7d7;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .demo-info {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.85rem;
    color: #718096;
    text-align: center;
  }
  
  .demo-info p {
    margin: 0.25rem 0;
  }
</style>
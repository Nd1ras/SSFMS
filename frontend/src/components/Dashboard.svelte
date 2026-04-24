<script>
  import { onMount } from 'svelte';
  import { user } from '../store.js';
  import { api } from '../api.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let data = null;
  let loading = true;
  let error = '';
  
  onMount(async () => {
    try {
      data = await api.getDashboard();
    } catch (err) {
      console.error(err);
      error = err?.message || 'Failed to load dashboard';
    } finally {
      loading = false;
    }
  });

  $: summary = data?.summary || { total: 0, active: 0, atRisk: 0, completed: 0 };
  $: byCrop = data?.byCrop || {};
  $: byStage = data?.byStage || {};
  $: recentUpdates = data?.recentUpdates || [];
  
  function getStatusColor(status) {
    const colors = {
      'Active': '#48bb78',
      'At Risk': '#ed8936',
      'Completed': '#4299e1'
    };
    return colors[status] || '#a0aec0';
  }
</script>

{#if loading}
  <div class="loading">Loading dashboard...</div>
{:else if error}
  <div class="error">{error}</div>
{:else if data}
  <div class="dashboard">
    <h2>Dashboard</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{summary.total}</div>
        <div class="stat-label">Total Fields</div>
      </div>
      <div class="stat-card active">
        <div class="stat-value">{summary.active}</div>
        <div class="stat-label">Active</div>
      </div>
      <div class="stat-card risk">
        <div class="stat-value">{summary.atRisk}</div>
        <div class="stat-label">At Risk</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">{summary.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
    </div>
    
    <div class="dashboard-grid">
      <div class="card">
        <h3>By Crop Type</h3>
        {#if Object.keys(byCrop).length === 0}
          <p class="empty">No data available</p>
        {:else}
          <div class="list">
            {#each Object.entries(byCrop) as [crop, count]}
              <div class="list-item">
                <span>{crop}</span>
                <span class="badge">{count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="card">
        <h3>By Stage</h3>
        <div class="stages">
          {#each Object.entries(byStage) as [stage, count]}
            <div class="stage-bar">
              <div class="stage-label">{stage}</div>
              <div class="stage-track">
                <div class="stage-fill" style="width: {summary.total ? (count / summary.total * 100) : 0}%"></div>
              </div>
              <div class="stage-count">{count}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <div class="card recent-updates">
      <h3>Recent Updates</h3>
      {#if recentUpdates.length === 0}
        <p class="empty">No updates yet</p>
      {:else}
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Stage</th>
              <th>Notes</th>
              <th>By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {#each recentUpdates as update}
              <tr>
                <td>
                  <button class="link" on:click={() => dispatch('navigate', { page: 'field-detail', id: update.field_id })}>
                    {update.field_name}
                  </button>
                </td>
                <td><span class="stage-badge">{update.stage}</span></td>
                <td>{update.notes || '-'}</td>
                <td>{update.updater_name}</td>
                <td>{new Date(update.created_at).toLocaleDateString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dashboard h2 {
    margin-bottom: 1.5rem;
    color: #2d3748;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-left: 4px solid #a0aec0;
  }
  
  .stat-card.active { border-left-color: #48bb78; }
  .stat-card.risk { border-left-color: #ed8936; }
  .stat-card.completed { border-left-color: #4299e1; }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2d3748;
  }
  
  .stat-label {
    color: #718096;
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .card h3 {
    margin-bottom: 1rem;
    color: #2d3748;
    font-size: 1.1rem;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .badge {
    background: #edf2f7;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .stages {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .stage-bar {
    display: grid;
    grid-template-columns: 80px 1fr 40px;
    align-items: center;
    gap: 1rem;
  }
  
  .stage-label {
    font-size: 0.9rem;
    color: #4a5568;
  }
  
  .stage-track {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .stage-fill {
    height: 100%;
    background: #2f855a;
    border-radius: 4px;
    transition: width 0.3s;
  }
  
  .stage-count {
    text-align: right;
    font-weight: 600;
    color: #2d3748;
  }
  
  .recent-updates {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  th, td {
    text-align: left;
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    font-weight: 600;
    color: #4a5568;
    background: #f7fafc;
  }
  
  .link {
    background: none;
    border: none;
    color: #2f855a;
    cursor: pointer;
    text-decoration: underline;
    font-size: inherit;
  }
  
  .stage-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #c6f6d5;
    color: #22543d;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .empty {
    color: #a0aec0;
    font-style: italic;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
    color: #718096;
  }

  .error {
    text-align: center;
    padding: 3rem;
    color: #c53030;
  }
</style>
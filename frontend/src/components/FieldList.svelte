<script>
  import { onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte'
  import { user } from '../store.js'
  import { api } from '../api.js'
  
  const dispatch = createEventDispatcher()
  
  let fields = []
  let loading = true
  let error = null
  let showCreateModal = false
  
  // Create form
  let newField = { name: '', crop_type: '', planting_date: '', assigned_to: '' }
  let agents = []
  let creating = false
  
  onMount(async () => {
    await loadFields()
    if ($user.role === 'admin') {
      // Fetch agents for assignment dropdown
      try {
        const res = await fetch('/api/auth/agents', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        // Note: agents endpoint not implemented, we'll handle gracefully
      } catch (e) {}
    }
  })
  
  async function loadFields() {
    loading = true
    error = null
    try {
      fields = await api.getFields()
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
  
  async function createField() {
    creating = true
    try {
      await api.createField(newField)
      showCreateModal = false
      newField = { name: '', crop_type: '', planting_date: '', assigned_to: '' }
      await loadFields()
    } catch (err) {
      alert(err.message)
    } finally {
      creating = false
    }
  }
  
  async function deleteField(id) {
    if (!confirm('Delete this field?')) return
    try {
      await api.deleteField(id)
      await loadFields()
    } catch (err) {
      alert(err.message)
    }
  }
  
  function getStatusBadge(status) {
    const styles = {
      'Active': { bg: '#dcfce7', text: '#166534', label: 'Active' },
      'At Risk': { bg: '#ffedd5', text: '#c2410c', label: 'At Risk' },
      'Completed': { bg: '#e0e7ff', text: '#4338ca', label: 'Completed' }
    }
    return styles[status] || { bg: '#f1f5f9', text: '#64748b', label: status }
  }
  
  function getStageBadge(stage) {
    const styles = {
      'Planted': { bg: '#ecfccb', text: '#3f6212' },
      'Growing': { bg: '#cffafe', text: '#155e75' },
      'Ready': { bg: '#fef3c7', text: '#92400e' },
      'Harvested': { bg: '#ede9fe', text: '#5b21b6' }
    }
    return styles[stage] || { bg: '#f1f5f9', text: '#64748b' }
  }
  
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }
</script>

<div class="field-list">
  <div class="page-header">
    <div>
      <h2>Fields</h2>
      <p class="subtitle">Manage and monitor crop fields</p>
    </div>
    {#if $user.role === 'admin'}
      <button class="btn-primary" on:click={() => showCreateModal = true}>
        + New Field
      </button>
    {/if}
  </div>
  
  {#if loading}
    <div class="loading">Loading fields...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if fields.length === 0}
    <div class="empty-state">
      <div class="empty-icon">🌾</div>
      <h3>No fields yet</h3>
      <p>{$user.role === 'admin' ? 'Create your first field to get started.' : 'No fields assigned to you yet.'}</p>
    </div>
  {:else}
    <div class="fields-table-wrapper">
      <table class="fields-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Crop</th>
            <th>Planted</th>
            <th>Stage</th>
            <th>Status</th>
            <th>Agent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each fields as field}
            {@const status = getStatusBadge(field.status)}
            {@const stage = getStageBadge(field.current_stage)}
            <tr>
              <td>
                <button class="field-name-btn" on:click={() => dispatch('navigate', { page: 'field-detail', id: field.id })}>
                  {field.name}
                </button>
              </td>
              <td>
                <span class="crop-tag">{field.crop_type}</span>
              </td>
              <td class="date-cell">{formatDate(field.planting_date)}</td>
              <td>
                <span class="badge" style="background: {stage.bg}; color: {stage.text}">
                  {field.current_stage}
                </span>
              </td>
              <td>
                <span class="badge" style="background: {status.bg}; color: {status.text}">
                  {status.label}
                </span>
              </td>
              <td class="agent-cell">{field.agent_name || 'Unassigned'}</td>
              <td>
                <div class="actions">
                  <button class="action-btn view" on:click={() => dispatch('navigate', { page: 'field-detail', id: field.id })}>
                    View
                  </button>
                  {#if $user.role === 'admin'}
                    <button class="action-btn delete" on:click={() => deleteField(field.id)}>
                      Delete
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Create Modal -->
{#if showCreateModal}
  <div class="modal-overlay" on:click={() => showCreateModal = false} on:keydown={(e) => e.key === 'Escape' && (showCreateModal = false)} role="button" tabindex="0">
    <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <h3>Create New Field</h3>
        <button class="close-btn" on:click={() => (showCreateModal = false)} aria-label="Close create field modal">×</button>
      </div>
      
      <form on:submit|preventDefault={createField}>
        <div class="form-group">
          <label for="field-name">Field Name</label>
          <input id="field-name" type="text" bind:value={newField.name} required placeholder="e.g. North Plot A" />
        </div>
        
        <div class="form-group">
          <label for="crop-type">Crop Type</label>
          <input id="crop-type" type="text" bind:value={newField.crop_type} required placeholder="e.g. Corn, Wheat, Soybeans" />
        </div>
        
        <div class="form-group">
          <label for="planting-date">Planting Date</label>
          <input id="planting-date" type="date" bind:value={newField.planting_date} required />
        </div>
        
        <div class="form-group">
          <label for="assigned-agent">Assign to Agent (optional)</label>
          <input id="assigned-agent" type="number" bind:value={newField.assigned_to} placeholder="Agent User ID" />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" on:click={() => showCreateModal = false}>Cancel</button>
          <button type="submit" class="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Field'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .page-header h2 {
    font-size: 1.875rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.025em;
  }
  
  .subtitle {
    color: #64748b;
    margin-top: 0.25rem;
  }
  
  .btn-primary {
    background: #166534;
    color: white;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }
  
  .btn-primary:hover {
    background: #14532d;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .fields-table-wrapper {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .fields-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .fields-table thead {
    background: #f8fafc;
  }
  
  .fields-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #475569;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .fields-table td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }
  
  .fields-table tbody tr:hover {
    background: #f8fafc;
  }
  
  .field-name-btn {
    background: none;
    border: none;
    color: #166534;
    font-weight: 700;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
  }
  
  .field-name-btn:hover {
    text-decoration: underline;
  }
  
  .crop-tag {
    background: #f0fdf4;
    color: #166534;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
  }
  
  .date-cell {
    color: #64748b;
    font-size: 0.85rem;
  }
  
  .agent-cell {
    color: #64748b;
    font-size: 0.85rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  
  .action-btn.view {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .action-btn.view:hover {
    background: #bfdbfe;
  }
  
  .action-btn.delete {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .action-btn.delete:hover {
    background: #fecaca;
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h3 {
    color: #0f172a;
    margin-bottom: 0.5rem;
  }
  
  .empty-state p {
    color: #64748b;
  }
  
  .loading, .error {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }
  
  .error {
    color: #dc2626;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #64748b;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
  
  .modal form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #334155;
    font-size: 0.875rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: #f8fafc;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #166534;
    box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.1);
    background: white;
  }
  
  .modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  
  .btn-secondary {
    background: white;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary:hover {
    background: #f8fafc;
  }
</style>
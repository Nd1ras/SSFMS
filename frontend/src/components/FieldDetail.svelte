<script>
  import { onMount } from 'svelte';
  import { user } from '../store.js';
  import { api } from '../api.js';
  import { createEventDispatcher } from 'svelte';
  
  export let fieldId;
  const dispatch = createEventDispatcher();
  
  let field = null;
  let loading = true;
  let newStage = '';
  let notes = '';
  
  const stages = ['Planted', 'Growing', 'Ready', 'Harvested'];
  
  onMount(async () => {
    await loadField();
  });
  
  async function loadField() {
    try {
      field = await api.getField(fieldId);
      newStage = field.current_stage;
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  }
  
  async function submitUpdate() {
    try {
      await api.updateField(fieldId, { stage: newStage, notes });
      await loadField();
      notes = '';
    } catch (err) {
      alert(err.message);
    }
  }
  
  function canUpdate() {
    if ($user.role === 'admin') return true;
    if ($user.role === 'field_agent' && field.assigned_to === $user.id) return true;
    return false;
  }
</script>

{#if loading}
  <div class="loading">Loading...</div>
{:else if field}
  <div class="field-detail">
    <button class="back" on:click={() => dispatch('navigate', { page: 'fields' })}>← Back to Fields</button>
    
    <div class="header">
      <div>
        <h2>{field.name}</h2>
        <span class="crop">{field.crop_type}</span>
      </div>
      <div class="badges">
        <span class="badge stage">{field.current_stage}</span>
        <span class="badge status-{field.status.toLowerCase().replace(' ', '-')}">{field.status}</span>
      </div>
    </div>
    
    <div class="detail-grid">
      <div class="info-card">
        <h3>Field Information</h3>
        <div class="info-row">
          <span class="label">Planting Date</span>
          <span>{new Date(field.planting_date).toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Assigned Agent</span>
          <span>{field.agent_name || 'Unassigned'}</span>
        </div>
        <div class="info-row">
          <span class="label">Last Updated</span>
          <span>{field.last_updated ? new Date(field.last_updated).toLocaleDateString() : 'Never'}</span>
        </div>
      </div>
      
      {#if canUpdate()}
        <div class="update-card">
          <h3>Update Progress</h3>
          <form on:submit|preventDefault={submitUpdate}>
            <div class="form-group">
              <label for="new-stage">New Stage</label>
              <select id="new-stage" bind:value={newStage}>
                {#each stages as stage}
                  <option value={stage} disabled={stages.indexOf(stage) < stages.indexOf(field.current_stage)}>
                    {stage}
                  </option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label for="stage-notes">Notes / Observations</label>
              <textarea id="stage-notes" bind:value={notes} rows="3" placeholder="Add observations..."></textarea>
            </div>
            <button type="submit" class="btn-primary" disabled={newStage === field.current_stage && !notes}>
              Submit Update
            </button>
          </form>
        </div>
      {/if}
    </div>
    
    <div class="history-card">
      <h3>Update History</h3>
      {#if field.updates.length === 0}
        <p class="empty">No updates yet</p>
      {:else}
        <div class="timeline">
          {#each field.updates as update, i}
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-stage">{update.stage}</span>
                  <span class="timeline-date">{new Date(update.created_at).toLocaleDateString()}</span>
                </div>
                <p class="timeline-notes">{update.notes || 'No notes'}</p>
                <span class="timeline-by">by {update.updater_name}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .back {
    background: none;
    border: none;
    color: #2f855a;
    cursor: pointer;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    padding: 0;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .crop {
    color: #718096;
    font-size: 0.9rem;
  }
  
  .badges {
    display: flex;
    gap: 0.5rem;
  }
  
  .badge {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .stage {
    background: #c6f6d5;
    color: #22543d;
  }
  
  .status-active { background: #c6f6d5; color: #22543d; }
  .status-at-risk { background: #feebc8; color: #7c2d12; }
  .status-completed { background: #bee3f8; color: #2a4365; }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .info-card, .update-card, .history-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  .info-card h3, .update-card h3, .history-card h3 {
    margin-bottom: 1rem;
    color: #2d3748;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .label {
    color: #718096;
    font-size: 0.9rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #4a5568;
  }
  
  select, textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-family: inherit;
  }
  
  .btn-primary {
    background: #2f855a;
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .timeline {
    position: relative;
    padding-left: 1.5rem;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 1.5rem;
  }
  
  .timeline-marker {
    position: absolute;
    left: -1.625rem;
    top: 0.25rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #2f855a;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #2f855a;
  }
  
  .timeline-content {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 6px;
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .timeline-stage {
    font-weight: 600;
    color: #2f855a;
  }
  
  .timeline-date {
    font-size: 0.85rem;
    color: #a0aec0;
  }
  
  .timeline-notes {
    color: #4a5568;
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
  
  .timeline-by {
    font-size: 0.8rem;
    color: #a0aec0;
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
</style>
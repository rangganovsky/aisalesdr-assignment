import { useState } from 'react';
import { Layout } from './components/Layout';
import { LeadTable } from './components/LeadTable';
import { AddLeadForm } from './components/AddLeadForm';

function App() {
  const [view, setView] = useState<'list' | 'add'>('list');

  return (
    <Layout currentView={view} onViewChange={setView}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === 'list' && <LeadTable />}
        {view === 'add' && <AddLeadForm onSuccess={() => setView('list')} />}
      </div>
    </Layout>
  );
}

export default App;

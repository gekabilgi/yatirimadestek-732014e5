import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { KnowledgeBaseManager } from "@/components/admin/KnowledgeBaseManager";

const AdminKnowledgeBase = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Chatbot Bilgi Bankası"
          description="AI chatbot için dökümanları yükleyin ve yönetin"
        />
        
        <KnowledgeBaseManager />
      </div>
    </AdminLayout>
  );
};

export default AdminKnowledgeBase;

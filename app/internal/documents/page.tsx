"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, Search, FileText, Download, Shield, GitBranch, CheckCircle, XCircle, Clock, File } from "lucide-react";
import {
  useDocuments, useUploadDocument, useUpdateDocStatus, useDocumentVersions,
} from "@/lib/hooks/queries";
import {
  Card, Button, Select, EmptyState, Badge, Skeleton, Modal, Input, Spinner,
} from "@/components/ui";
import {
  cn, formatDate, formatRelative, formatFileSize, DOC_STATUS_CONFIG,
} from "@/lib/utils";
import type { Document, DocType, DocStatus } from "@/lib/types";
import { documentsApi } from "@/lib/api/client";

const DOC_TYPE_ICONS: Record<string, React.ReactNode> = {
  contract:   <FileText className="w-5 h-5" />,
  title_deed: <Shield className="w-5 h-5" />,
  survey:     <File className="w-5 h-5" />,
  permit:     <CheckCircle className="w-5 h-5" />,
  valuation:  <FileText className="w-5 h-5" />,
  id_doc:     <Shield className="w-5 h-5" />,
  other:      <File className="w-5 h-5" />,
};

// ─── Upload drop zone ─────────────────────────────────────────────────────────

function UploadZone({ propertyId, dealId, onSuccess }: {
  propertyId: string; dealId?: string; onSuccess?: () => void;
}) {
  const upload = useUploadDocument();
  const [dragging, setDragging] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<DocType>("other");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setDocName(file.name.replace(/\.[^.]+$/, ""));
    setOpen(true);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  async function doUpload() {
    if (!selectedFile || !propertyId.trim()) return;
    const fd = new FormData();
    fd.append("file", selectedFile);
    fd.append("property_id", propertyId);
    fd.append("name", docName);
    fd.append("type", docType);
    if (dealId) fd.append("deal_id", dealId);
    await upload.mutateAsync(fd);
    setOpen(false);
    setSelectedFile(null);
    setDocName("");
    onSuccess?.();
  }

  return (
    <>
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer",
          dragging
            ? "border-forest-400 bg-forest-50"
            : "border-stone-300 hover:border-forest-300 hover:bg-stone-50"
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={cn("w-8 h-8 mx-auto mb-3", dragging ? "text-forest-500" : "text-stone-400")} />
        <p className="text-sm font-medium text-stone-700 font-body">Drop files here or click to upload</p>
        <p className="text-xs text-stone-400 font-body mt-1">PDF, DOCX, XLSX — up to 50 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload Document">
        <div className="flex flex-col gap-4">
          <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3 border border-stone-200">
            <File className="w-5 h-5 text-stone-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 font-body truncate">{selectedFile?.name}</p>
              <p className="text-xs text-stone-500 font-body">{selectedFile ? formatFileSize(selectedFile.size) : ""}</p>
            </div>
          </div>
          <Input label="Document name" value={docName} onChange={e => setDocName(e.target.value)} />
          <Select
            label="Document type"
            value={docType}
            options={[
              { value: "contract",   label: "Contract"    },
              { value: "title_deed", label: "Title Deed"  },
              { value: "survey",     label: "Survey"      },
              { value: "permit",     label: "Permit"      },
              { value: "valuation",  label: "Valuation"   },
              { value: "id_doc",     label: "ID Document" },
              { value: "other",      label: "Other"       },
            ]}
            onChange={e => setDocType(e.target.value as DocType)}
          />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={doUpload} isLoading={upload.isPending}>Upload</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc, onStatusUpdate }: { doc: Document; onStatusUpdate: (id: string, status: DocStatus) => void }) {
  const [versionOpen, setVersionOpen] = useState(false);
  const { data: versions } = useDocumentVersions(versionOpen ? doc.id : "");
  const [downloading, setDownloading] = useState(false);

  const cfg = DOC_STATUS_CONFIG[doc.status];

  async function download() {
    setDownloading(true);
    try {
      const { url } = await documentsApi.downloadUrl(doc.id);
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 py-4 px-5 hover:bg-stone-50 transition-colors group">
        <div className="text-stone-400 flex-shrink-0">
          {DOC_TYPE_ICONS[doc.type] ?? <File className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-stone-900 font-body truncate">{doc.name}</p>
            {doc.version > 1 && (
              <span className="text-2xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono">v{doc.version}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-stone-400 font-body capitalize">{doc.type.replace("_", " ")}</span>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-400 font-body">{formatFileSize(doc.file_size_bytes)}</span>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-400 font-body">{formatDate(doc.uploaded_at)}</span>
          </div>
        </div>
        <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {doc.version > 1 && (
            <Button variant="ghost" size="xs" onClick={() => setVersionOpen(true)}>
              <GitBranch className="w-3.5 h-3.5" /> History
            </Button>
          )}
          {doc.status === "pending_review" && (
            <>
              <Button variant="ghost" size="xs" onClick={() => onStatusUpdate(doc.id, "approved")} className="text-forest-700 hover:bg-forest-50">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button variant="ghost" size="xs" onClick={() => onStatusUpdate(doc.id, "rejected")} className="text-rose-700 hover:bg-rose-50">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          <Button variant="ghost" size="xs" onClick={download} isLoading={downloading}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Modal open={versionOpen} onClose={() => setVersionOpen(false)} title="Version History">
        {!versions ? <div className="flex justify-center py-6"><Spinner /></div> : (
          <div className="space-y-2">
            {versions.versions?.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-xs font-mono bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">v{v.version}</span>
                <div className="flex-1 min-w-0">
                  <Badge color={DOC_STATUS_CONFIG[v.status].color} bg={DOC_STATUS_CONFIG[v.status].bg}>
                    {DOC_STATUS_CONFIG[v.status].label}
                  </Badge>
                </div>
                <span className="text-xs text-stone-500 font-body">{formatDate(v.uploaded_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const updateStatus = useUpdateDocStatus("");

  const query: Record<string, string> = {};
  if (filterType)   query.type   = filterType;
  if (filterStatus) query.status = filterStatus;
  if (propertyId)   query.property_id = propertyId;

  const { data, isLoading } = useDocuments(Object.keys(query).length ? query : undefined);
  const docs = (data?.data ?? []).filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleStatusUpdate(docId: string, status: DocStatus) {
    await documentsApi.updateStatus(docId, { status });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-stone-900">Documents</h1>
          <p className="text-stone-500 text-sm font-body mt-0.5">{docs.length} documents</p>
        </div>
      </div>

      {/* Upload zone */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="Property ID to upload to…"
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="w-72"
          />
          <p className="text-xs text-stone-500 font-body">Documents are linked to a property</p>
        </div>
        {propertyId && <UploadZone propertyId={propertyId} />}
        {!propertyId && (
          <div className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center">
            <p className="text-sm text-stone-400 font-body">Enter a property ID above to enable upload</p>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search documents…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="w-64"
        />
        <Select
          placeholder="All types"
          options={[
            { value: "contract",   label: "Contract"    },
            { value: "title_deed", label: "Title Deed"  },
            { value: "survey",     label: "Survey"      },
            { value: "permit",     label: "Permit"      },
            { value: "valuation",  label: "Valuation"   },
            { value: "other",      label: "Other"       },
          ]}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="w-44"
        />
        <Select
          placeholder="All statuses"
          options={[
            { value: "draft",          label: "Draft"          },
            { value: "pending_review", label: "Pending Review" },
            { value: "approved",       label: "Approved"       },
            { value: "rejected",       label: "Rejected"       },
            { value: "signed",         label: "Signed"         },
          ]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-44"
        />
      </div>

      {/* Document list */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No documents found"
            description="Upload a document or adjust your filters."
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {docs.map(doc => (
              <DocumentRow key={doc.id} doc={doc} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";
import { useState } from "react";
import {
  FileText, Download, Shield, File, CheckCircle,
  XCircle, Search, GitBranch, Upload,
} from "lucide-react";
import { useDocuments, useUploadDocument, useUpdateDocStatus } from "@/lib/hooks/queries";
import { useAuth } from "@/lib/auth/context";
import {
  Card, Button, Select, EmptyState, Badge, Skeleton, Modal, Input, Spinner,
} from "@/components/ui";
import {
  cn, formatDate, formatFileSize, formatRelative, DOC_STATUS_CONFIG,
} from "@/lib/utils";
import { documentsApi } from "@/lib/api/client";
import type { Document, DocStatus } from "@/lib/types";
import { useRef, useCallback } from "react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  contract:   <FileText className="w-5 h-5" />,
  title_deed: <Shield className="w-5 h-5" />,
  survey:     <File className="w-5 h-5" />,
  permit:     <CheckCircle className="w-5 h-5" />,
  valuation:  <FileText className="w-5 h-5" />,
  id_doc:     <Shield className="w-5 h-5" />,
  other:      <File className="w-5 h-5" />,
};

// ─── Upload zone (for lawyers and surveyors) ──────────────────────────────────

function UploadZone({ propertyId }: { propertyId: string }) {
  const upload = useUploadDocument();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("other");
  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setDocName(file.name.replace(/\.[^.]+$/, ""));
    setModalOpen(true);
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
    await upload.mutateAsync(fd);
    setModalOpen(false);
    setSelectedFile(null);
    setDocName("");
  }

  return (
    <>
      <div
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          dragging
            ? "border-forest-400 bg-forest-50"
            : "border-stone-300 hover:border-forest-300 hover:bg-stone-50"
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={cn("w-7 h-7 mx-auto mb-2.5", dragging ? "text-forest-500" : "text-stone-400")} />
        <p className="text-sm font-medium text-stone-700 font-body">Drop files here or click to browse</p>
        <p className="text-xs text-stone-400 font-body mt-1">PDF, DOCX, XLSX — max 50 MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document">
        <div className="flex flex-col gap-4">
          {selectedFile && (
            <div className="bg-stone-50 rounded-xl p-3 flex items-center gap-3 border border-stone-200">
              <File className="w-5 h-5 text-stone-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 font-body truncate">{selectedFile.name}</p>
                <p className="text-xs text-stone-500 font-body">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
          )}
          <Input
            label="Document name"
            value={docName}
            onChange={e => setDocName(e.target.value)}
          />
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
            onChange={e => setDocType(e.target.value)}
          />
          {upload.error && (
            <p className="text-sm text-rose-600 font-body">{(upload.error as Error).message}</p>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={doUpload} isLoading={upload.isPending}>Upload</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocRow({ doc, canReview }: { doc: Document; canReview: boolean }) {
  const updateStatus = useUpdateDocStatus(doc.id);
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
    <div className="flex items-center gap-4 py-4 px-5 hover:bg-stone-50 transition-colors group border-b border-stone-100 last:border-0">
      <div className="text-stone-400 flex-shrink-0 w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
        {TYPE_ICONS[doc.type] ?? <File className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-900 font-body truncate">{doc.name}</p>
          {doc.version > 1 && (
            <span className="text-2xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
              v{doc.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-stone-400 font-body capitalize">{doc.type.replace(/_/g, " ")}</span>
          <span className="text-stone-300 text-xs">·</span>
          <span className="text-xs text-stone-400 font-body">{formatFileSize(doc.file_size_bytes)}</span>
          <span className="text-stone-300 text-xs">·</span>
          <span className="text-xs text-stone-400 font-body">{formatDate(doc.uploaded_at)}</span>
        </div>
      </div>

      <Badge color={cfg.color} bg={cfg.bg}>{cfg.label}</Badge>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {canReview && doc.status === "pending_review" && (
          <>
            <Button
              variant="ghost" size="xs"
              className="text-forest-700 hover:bg-forest-50"
              onClick={() => updateStatus.mutate({ status: "approved" })}
              isLoading={updateStatus.isPending}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </Button>
            <Button
              variant="ghost" size="xs"
              className="text-rose-700 hover:bg-rose-50"
              onClick={() => updateStatus.mutate({ status: "rejected" })}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          </>
        )}
        <Button
          variant="ghost" size="xs"
          onClick={download}
          isLoading={downloading}
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExternalDocumentsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const canUpload = role === "lawyer" || role === "surveyor";
  const canReview = role === "lawyer";

  const query: Record<string, string> = {};
  if (filterType)   query.type   = filterType;
  if (filterStatus) query.status = filterStatus;

  const { data, isLoading } = useDocuments(Object.keys(query).length ? query : undefined);
  const docs = (data?.data ?? []).filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-stone-500 text-sm font-body uppercase tracking-wider font-medium mb-1">
          {role === "lawyer" ? "Legal Documents" : "Survey Documents"}
        </p>
        <h1 className="font-display text-4xl text-stone-900">Your documents</h1>
        <p className="text-stone-500 text-sm font-body mt-2">
          {role === "lawyer"
            ? "Documents shared with you for review, signing, and approval."
            : "Survey reports and related documents."}
        </p>
      </div>

      {/* Upload (lawyer/surveyor only) */}
      {canUpload && (
        <Card className="p-6">
          <h2 className="font-display text-lg text-stone-900 mb-4">Upload a document</h2>
          <div className="mb-4">
            <Input
              label="Property ID"
              placeholder="Paste the property UUID from your agent"
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {propertyId ? (
            <UploadZone propertyId={propertyId} />
          ) : (
            <div className="border-2 border-dashed border-stone-200 rounded-2xl py-8 text-center">
              <p className="text-sm text-stone-400 font-body">Enter a property ID above to enable upload</p>
            </div>
          )}
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          className="w-60"
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
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No documents yet"
            description={
              canUpload
                ? "Upload a document using the form above, or wait for your agent to share one."
                : "Your agent hasn't shared any documents with you yet."
            }
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {docs.map(doc => (
              <DocRow key={doc.id} doc={doc} canReview={canReview} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

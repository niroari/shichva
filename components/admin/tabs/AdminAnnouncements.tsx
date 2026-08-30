"use client";

import { useEffect, useRef, useState } from "react";
import AdminGuide from "@/components/admin/AdminGuide";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import Image from "next/image";

interface Announcement {
  id: string;
  order: number;
  date: string;
  title: string;
  body: string;
  imageUrl?: string;
  imageStoragePath?: string;
  important: boolean;
}

interface Props {
  classId: string;
}

export default function AdminAnnouncements({ classId }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImportant, setNewImportant] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFilePreview, setNewFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImportant, setEditImportant] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [editRemoveImage, setEditRemoveImage] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const colRef = collection(db, "classes", classId, "announcements");

  useEffect(() => {
    const announcementsRef = collection(db, "classes", classId, "announcements");
    const q = query(announcementsRef, orderBy("order"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [classId]);

  function handleFileSelect(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setNewFile(file);
    const url = URL.createObjectURL(file);
    setNewFilePreview(url);
  }

  function handleEditFileSelect(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setEditFile(file);
    setEditRemoveImage(false);
    const url = URL.createObjectURL(file);
    setEditFilePreview(url);
  }

  function clearNewFile() {
    setNewFile(null);
    if (newFilePreview) {
      URL.revokeObjectURL(newFilePreview);
      setNewFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearEditFile() {
    setEditFile(null);
    if (editFilePreview) {
      URL.revokeObjectURL(editFilePreview);
      setEditFilePreview(null);
    }
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  async function uploadImageFile(file: File, setProgress: (pct: number) => void) {
    const storagePath = `classes/${classId}/announcements/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const task = uploadBytesResumable(storageRef, file);

    return new Promise<{ url: string; storagePath: string }>((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setProgress(pct);
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, storagePath });
        }
      );
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(null);

    let imageUrl: string | undefined = undefined;
    let imageStoragePath: string | undefined = undefined;

    try {
      if (newFile) {
        const uploaded = await uploadImageFile(newFile, (pct) => setUploadProgress(pct));
        imageUrl = uploaded.url;
        imageStoragePath = uploaded.storagePath;
      }

      const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;
      await addDoc(colRef, {
        order: nextOrder,
        date: newDate.trim(),
        title: newTitle.trim(),
        body: newBody.trim(),
        important: newImportant,
        ...(imageUrl ? { imageUrl, imageStoragePath } : {}),
      });

      setNewDate("");
      setNewTitle("");
      setNewBody("");
      setNewImportant(false);
      clearNewFile();
    } catch (err) {
      console.error("Error adding announcement:", err);
      alert("שגיאה בהוספת ההודעה. נסה שוב.");
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  }

  function startEdit(item: Announcement) {
    setEditId(item.id);
    setEditDate(item.date);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditImportant(item.important);
    setEditImageUrl(item.imageUrl || null);
    setEditRemoveImage(false);
    clearEditFile();
  }

  function cancelEdit() {
    setEditId(null);
    clearEditFile();
    setEditRemoveImage(false);
  }

  async function saveEdit(item: Announcement) {
    setEditSaving(true);
    setEditUploadProgress(null);

    try {
      let finalImageUrl = item.imageUrl || null;
      let finalImageStoragePath = item.imageStoragePath || null;

      // Handle new file upload
      if (editFile) {
        const uploaded = await uploadImageFile(editFile, (pct) => setEditUploadProgress(pct));
        // If there was an existing old image file in storage, delete it
        if (item.imageStoragePath) {
          try {
            await deleteObject(ref(storage, item.imageStoragePath));
          } catch {
            // Ignore if file doesn't exist
          }
        }
        finalImageUrl = uploaded.url;
        finalImageStoragePath = uploaded.storagePath;
      } else if (editRemoveImage) {
        // User requested removing the image
        if (item.imageStoragePath) {
          try {
            await deleteObject(ref(storage, item.imageStoragePath));
          } catch {
            // Ignore if file doesn't exist
          }
        }
        finalImageUrl = null;
        finalImageStoragePath = null;
      }

      await updateDoc(doc(db, "classes", classId, "announcements", item.id), {
        date: editDate.trim(),
        title: editTitle.trim(),
        body: editBody.trim(),
        important: editImportant,
        imageUrl: finalImageUrl,
        imageStoragePath: finalImageStoragePath,
      });

      setEditId(null);
      clearEditFile();
    } catch (err) {
      console.error("Error saving announcement edit:", err);
      alert("שגיאה בעדכון ההודעה. נסה שוב.");
    } finally {
      setEditSaving(false);
      setEditUploadProgress(null);
    }
  }

  async function handleDelete(item: Announcement) {
    if (!confirm(`למחוק את "${item.title}"?`)) return;
    if (item.imageStoragePath) {
      try {
        await deleteObject(ref(storage, item.imageStoragePath));
      } catch {
        // Ignore storage delete errors
      }
    }
    await deleteDoc(doc(db, "classes", classId, "announcements", item.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminGuide items={[
        "לחץ על הטופס למעלה כדי להוסיף הודעה חדשה (כולל אפשרות לצירוף תמונה)",
        'סמן "הודעה דחופה" כדי שתופיע עם רקע בולט',
        "לעריכת הודעה קיימת — לחץ על כפתור העריכה בשורה שלה",
        "למחיקה — לחץ על הכפתור האדום",
      ]} />
      {/* Add form */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">הוספת הודעה</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>תאריך</label>
              <input
                type="text"
                placeholder="למשל: 10.4"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>כותרת *</label>
              <input
                type="text"
                placeholder="כותרת ההודעה"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>תוכן (אופציונלי)</label>
            <textarea
              placeholder="פרטים נוספים..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={3}
            />
          </div>

          {/* Media / Image Attachment */}
          <div className="form-group">
            <label>צירוף תמונה (אופציונלי)</label>
            {!newFilePreview ? (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/20 hover:border-purple-400/50 bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-xl">📷</span>
                <span className="text-xs text-muted-foreground">
                  לחץ לבחירת תמונה (JPG, PNG, WEBP)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/15 bg-white/[0.04]">
                <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
                  <Image
                    src={newFilePreview}
                    alt="תצוגה מקדימה"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate">
                    {newFile?.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {newFile ? `${(newFile.size / 1024).toFixed(0)} KB` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearNewFile}
                  className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                  title="הסר תמונה"
                >
                  ✕ הסר
                </button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>מעלה תמונה...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="form-check">
              <input
                type="checkbox"
                checked={newImportant}
                onChange={(e) => setNewImportant(e.target.checked)}
              />
              <span className="text-sm text-muted-foreground">הודעה חשובה</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary mr-auto"
            >
              {saving ? "שומר..." : "+ הוסף הודעה"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing list */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">הודעות קיימות</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">טוען...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין הודעות עדיין.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>תאריך</th>
                  <th style={{ width: 60 }}>תמונה</th>
                  <th>כותרת</th>
                  <th>תוכן</th>
                  <th style={{ width: 60 }}>חשוב</th>
                  <th style={{ width: 130 }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) =>
                  editId === item.id ? (
                    // Edit row
                    <tr key={item.id}>
                      <td>
                        <input
                          className="inline-input"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1.5 items-center">
                          {editFilePreview ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden border border-white/20">
                              <Image
                                src={editFilePreview}
                                alt="חדש"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : editImageUrl && !editRemoveImage ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden border border-white/20">
                              <Image
                                src={editImageUrl}
                                alt="קיים"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <div className="flex gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="text-purple-400 hover:text-purple-300 underline"
                            >
                              {editFilePreview || (editImageUrl && !editRemoveImage) ? "החלף" : "הוסף"}
                            </button>
                            {(editFilePreview || (editImageUrl && !editRemoveImage)) && (
                              <button
                                type="button"
                                onClick={() => {
                                  clearEditFile();
                                  setEditRemoveImage(true);
                                }}
                                className="text-red-400 hover:text-red-300 underline"
                              >
                                הסר
                              </button>
                            )}
                          </div>
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleEditFileSelect(e.target.files?.[0])}
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{ minWidth: 160 }}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          style={{ minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editImportant}
                          onChange={(e) => setEditImportant(e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-2">
                            <button
                              className="btn-save"
                              onClick={() => saveEdit(item)}
                              disabled={editSaving}
                            >
                              {editSaving ? "..." : "שמור"}
                            </button>
                            <button className="btn-cancel" onClick={cancelEdit}>
                              ביטול
                            </button>
                          </div>
                          {editUploadProgress !== null && (
                            <span className="text-[10px] text-muted-foreground text-center">
                              מעלה: {editUploadProgress}%
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Display row
                    <tr key={item.id}>
                      <td className="cell-nowrap cell-dim">{item.date}</td>
                      <td>
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden border border-white/10">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="cell-trunc">
                        {item.important && <span className="important-badge">חשוב</span>}{" "}
                        {item.title}
                      </td>
                      <td className="cell-trunc cell-dim">{item.body || "—"}</td>
                      <td style={{ textAlign: "center" }}>{item.important ? "✓" : ""}</td>
                      <td className="cell-nowrap">
                        <div className="flex gap-2">
                          <button className="btn-edit" onClick={() => startEdit(item)}>עריכה</button>
                          <button className="btn-danger" onClick={() => handleDelete(item)}>מחיקה</button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

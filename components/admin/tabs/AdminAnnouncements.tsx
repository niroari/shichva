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
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "pdf";
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
  const [newFileType, setNewFileType] = useState<"image" | "pdf" | null>(null);
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
  const [editFileName, setEditFileName] = useState<string | null>(null);
  const [editFileType, setEditFileType] = useState<"image" | "pdf" | null>(null);
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
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImg = file.type.startsWith("image/");
    if (!isPdf && !isImg) {
      alert("נא לבחור קובץ תמונה (JPG, PNG, WEBP) או קובץ PDF");
      return;
    }

    setNewFile(file);
    if (isPdf) {
      setNewFileType("pdf");
      setNewFilePreview(null);
    } else {
      setNewFileType("image");
      const url = URL.createObjectURL(file);
      setNewFilePreview(url);
    }
  }

  function handleEditFileSelect(file: File | undefined) {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImg = file.type.startsWith("image/");
    if (!isPdf && !isImg) {
      alert("נא לבחור קובץ תמונה (JPG, PNG, WEBP) או קובץ PDF");
      return;
    }

    setEditFile(file);
    setEditRemoveImage(false);
    if (isPdf) {
      setEditFileType("pdf");
      setEditFilePreview(null);
    } else {
      setEditFileType("image");
      const url = URL.createObjectURL(file);
      setEditFilePreview(url);
    }
  }

  function clearNewFile() {
    setNewFile(null);
    setNewFileType(null);
    if (newFilePreview) {
      URL.revokeObjectURL(newFilePreview);
      setNewFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearEditFile() {
    setEditFile(null);
    setEditFileType(null);
    if (editFilePreview) {
      URL.revokeObjectURL(editFilePreview);
      setEditFilePreview(null);
    }
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  async function compressImageToFileOrBase64(
    file: File,
    maxWidth = 1000,
    quality = 0.75
  ): Promise<{ compressedFile: File; base64: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ compressedFile: file, base64: e.target?.result as string });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/webp", quality);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, ".webp"),
                  {
                    type: "image/webp",
                    lastModified: Date.now(),
                  }
                );
                resolve({ compressedFile: compFile, base64: dataUrl });
              } else {
                resolve({ compressedFile: file, base64: dataUrl });
              }
            },
            "image/webp",
            quality
          );
        };
        img.onerror = () => {
          resolve({ compressedFile: file, base64: e.target?.result as string });
        };
      };
      reader.onerror = () => {
        resolve({ compressedFile: file, base64: "" });
      };
    });
  }

  async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  async function uploadOrEmbedFile(
    file: File,
    setProgress: (pct: number) => void
  ): Promise<{ url: string; storagePath?: string; fileName: string; fileType: "image" | "pdf" }> {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const fileType: "image" | "pdf" = isPdf ? "pdf" : "image";
    const fileName = file.name;

    if (isPdf) {
      // Handle PDF
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `classes/${classId}/gallery/announcement_${Date.now()}_${cleanName}`;
        const storageRef = ref(storage, storagePath);
        const task = uploadBytesResumable(storageRef, file);

        return await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setProgress(pct);
            },
            (err) => {
              console.warn("Storage upload error for PDF, falling back to embedded data URL:", err);
              reject(err);
            },
            async () => {
              try {
                const url = await getDownloadURL(task.snapshot.ref);
                resolve({ url, storagePath, fileName, fileType });
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch {
        // Fallback: Embed PDF as Data URL
        const base64 = await readFileAsBase64(file);
        return { url: base64, fileName, fileType };
      }
    } else {
      // Handle Image
      const { compressedFile, base64 } = await compressImageToFileOrBase64(file);
      try {
        const cleanName = compressedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `classes/${classId}/gallery/announcement_${Date.now()}_${cleanName}`;
        const storageRef = ref(storage, storagePath);
        const task = uploadBytesResumable(storageRef, compressedFile);

        return await new Promise((resolve, reject) => {
          task.on(
            "state_changed",
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setProgress(pct);
            },
            (err) => {
              console.warn("Storage upload error for image, falling back to embedded data URL:", err);
              reject(err);
            },
            async () => {
              try {
                const url = await getDownloadURL(task.snapshot.ref);
                resolve({ url, storagePath, fileName, fileType });
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch {
        // Fallback: Embed compressed image
        return { url: base64, fileName, fileType };
      }
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(null);

    let imageUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let fileType: "image" | "pdf" | undefined = undefined;
    let imageStoragePath: string | undefined = undefined;

    try {
      if (newFile) {
        const uploaded = await uploadOrEmbedFile(newFile, (pct) => setUploadProgress(pct));
        imageUrl = uploaded.url;
        fileName = uploaded.fileName;
        fileType = uploaded.fileType;
        imageStoragePath = uploaded.storagePath;
      }

      const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;
      await addDoc(colRef, {
        order: nextOrder,
        date: newDate.trim(),
        title: newTitle.trim(),
        body: newBody.trim(),
        important: newImportant,
        ...(imageUrl
          ? {
              imageUrl,
              fileUrl: imageUrl,
              fileName: fileName || "",
              fileType: fileType || "image",
              ...(imageStoragePath ? { imageStoragePath } : {}),
            }
          : {}),
      });

      setNewDate("");
      setNewTitle("");
      setNewBody("");
      setNewImportant(false);
      clearNewFile();
    } catch (err) {
      console.error("Error adding announcement:", err);
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      alert(`שגיאה בהוספת ההודעה: ${msg}`);
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
    setEditImageUrl(item.imageUrl || item.fileUrl || null);
    setEditFileName(item.fileName || null);
    const isPdf =
      item.fileType === "pdf" ||
      (item.imageUrl || item.fileUrl)?.includes(".pdf") ||
      (item.imageUrl || item.fileUrl)?.startsWith("data:application/pdf");
    setEditFileType(isPdf ? "pdf" : item.imageUrl ? "image" : null);
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
      let finalImageUrl = item.imageUrl || item.fileUrl || null;
      let finalFileName = item.fileName || null;
      let finalFileType = item.fileType || (finalImageUrl ? "image" : null);
      let finalImageStoragePath = item.imageStoragePath || null;

      // Handle new file upload
      if (editFile) {
        const uploaded = await uploadOrEmbedFile(editFile, (pct) => setEditUploadProgress(pct));
        if (item.imageStoragePath) {
          try {
            await deleteObject(ref(storage, item.imageStoragePath));
          } catch {
            // Ignore if file doesn't exist
          }
        }
        finalImageUrl = uploaded.url;
        finalFileName = uploaded.fileName;
        finalFileType = uploaded.fileType;
        finalImageStoragePath = uploaded.storagePath || null;
      } else if (editRemoveImage) {
        if (item.imageStoragePath) {
          try {
            await deleteObject(ref(storage, item.imageStoragePath));
          } catch {
            // Ignore if file doesn't exist
          }
        }
        finalImageUrl = null;
        finalFileName = null;
        finalFileType = null;
        finalImageStoragePath = null;
      }

      await updateDoc(doc(db, "classes", classId, "announcements", item.id), {
        date: editDate.trim(),
        title: editTitle.trim(),
        body: editBody.trim(),
        important: editImportant,
        imageUrl: finalImageUrl,
        fileUrl: finalImageUrl,
        fileName: finalFileName,
        fileType: finalFileType,
        imageStoragePath: finalImageStoragePath,
      });

      setEditId(null);
      clearEditFile();
    } catch (err) {
      console.error("Error saving announcement edit:", err);
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      alert(`שגיאה בעדכון ההודעה: ${msg}`);
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
        "לחץ על הטופס למעלה כדי להוסיף הודעה חדשה (כולל צירוף תמונה או מכתב ב-PDF)",
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

          {/* Media / File Attachment */}
          <div className="form-group">
            <label>צירוף מדיה או מסמך (תמונה / קובץ PDF)</label>
            {!newFile ? (
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/20 hover:border-purple-400/50 bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-xl">📎</span>
                <span className="text-xs text-muted-foreground">
                  לחץ לבחירת תמונה (JPG, PNG, WEBP) או מכתב/קובץ PDF
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/15 bg-white/[0.04]">
                {newFileType === "pdf" ? (
                  <div className="w-12 h-12 rounded-md bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 text-xl text-red-400">
                    📄
                  </div>
                ) : (
                  <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border border-white/10">
                    <Image
                      src={newFilePreview || ""}
                      alt="תצוגה מקדימה"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-medium text-foreground truncate">
                    {newFile.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {newFileType === "pdf" ? "קובץ PDF · " : "תמונה · "}
                    {`${(newFile.size / 1024).toFixed(0)} KB`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearNewFile}
                  className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                  title="הסר קובץ"
                >
                  ✕ הסר
                </button>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>מעלה קובץ...</span>
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
                  <th style={{ width: 70 }}>קובץ / מדיה</th>
                  <th>כותרת</th>
                  <th>תוכן</th>
                  <th style={{ width: 60 }}>חשוב</th>
                  <th style={{ width: 130 }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const itemUrl = item.imageUrl || item.fileUrl;
                  const isPdfItem =
                    item.fileType === "pdf" ||
                    itemUrl?.includes(".pdf") ||
                    itemUrl?.startsWith("data:application/pdf");

                  return editId === item.id ? (
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
                          {editFile ? (
                            editFileType === "pdf" ? (
                              <span className="text-lg" title="PDF חדש">📄</span>
                            ) : (
                              <div className="relative w-10 h-10 rounded overflow-hidden border border-white/20">
                                <Image
                                  src={editFilePreview || ""}
                                  alt="חדש"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            )
                          ) : editImageUrl && !editRemoveImage ? (
                            editFileType === "pdf" ? (
                              <a
                                href={editImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-lg hover:scale-110 transition-transform"
                                title={editFileName || "צפה ב-PDF"}
                              >
                                📄
                              </a>
                            ) : (
                              <div className="relative w-10 h-10 rounded overflow-hidden border border-white/20">
                                <Image
                                  src={editImageUrl}
                                  alt="קיים"
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          <div className="flex gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="text-purple-400 hover:text-purple-300 underline"
                            >
                              {editFile || (editImageUrl && !editRemoveImage) ? "החלף" : "הוסף"}
                            </button>
                            {(editFile || (editImageUrl && !editRemoveImage)) && (
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
                            accept="image/*,application/pdf,.pdf"
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
                        {itemUrl ? (
                          isPdfItem ? (
                            <a
                              href={itemUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 border border-red-500/20"
                              title={item.fileName || "פתח קובץ PDF"}
                            >
                              <span>📄</span>
                              <span className="text-[10px] font-bold">PDF</span>
                            </a>
                          ) : (
                            <div className="relative w-10 h-10 rounded-md overflow-hidden border border-white/10">
                              <Image
                                src={itemUrl}
                                alt={item.title}
                                fill
                                unoptimized
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          )
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

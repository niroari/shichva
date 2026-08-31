"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share2, PlusSquare, X, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getServerSnapshot() {
  return false;
}

export default function InstallAppButton() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getServerSnapshot
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  // Check for iOS
  const isIOS =
    typeof window !== "undefined" &&
    (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  useEffect(() => {
    // Listen for Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // If already running in standalone/installed mode, don't show the button
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalledSuccessfully(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Error triggering install prompt:", err);
        setShowModal(true);
      }
    } else {
      // For iOS or browsers where beforeinstallprompt isn't available
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer bg-primary/10 hover:bg-primary/20 text-foreground border border-primary/20 hover:border-primary/40 shadow-xs active:scale-95"
        title="התקן כאפליקציה בטלפון או במחשב"
        aria-label="התקן כאפליקציה"
      >
        {installedSuccessfully ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">הותקן בהצלחה</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-primary animate-bounce-subtle" />
            <span>התקן אפליקציה</span>
          </>
        )}
      </button>

      {/* Instructions Modal for iOS / Desktop without prompt */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-6 bg-card text-card-foreground border border-border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            style={{
              background: "var(--card-bg, rgba(255, 255, 255, 0.95))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">התקנת האתר כאפליקציה</h3>
                  <p className="text-xs text-muted-foreground">גישה מהירה מהמסך הראשי ללא צורך בדפדפן</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content based on platform */}
            {isIOS ? (
              <div className="space-y-4 text-sm text-foreground">
                <p className="text-xs text-muted-foreground font-medium">
                  במכשירי iPhone ו-iPad ניתן להתקין דרך דפדפן Safari בכמה צעדים פשוטים:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs sm:text-sm">
                        לחצו על כפתור השיתוף{" "}
                        <Share2 className="inline-block w-4 h-4 mx-1 text-primary align-text-bottom" />
                      </p>
                      <p className="text-xs text-muted-foreground">נמצא בתחתית המסך (או בסרגל הכלים העליון ב-iPad)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs sm:text-sm">
                        בחרו ב-<strong>״הוסף למסך הבית״</strong>{" "}
                        <PlusSquare className="inline-block w-4 h-4 mx-1 text-primary align-text-bottom" />
                      </p>
                      <p className="text-xs text-muted-foreground">גללו את רשימת האפשרויות עד למציאת האפשרות</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      3
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs sm:text-sm">לחצו על ״הוסף״ (Add) בפינה העליונה</p>
                      <p className="text-xs text-muted-foreground">סמל האפליקציה יופיע מיידית על מסך הבית שלכם</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-foreground">
                <p className="text-xs text-muted-foreground">
                  להתקנת האפליקציה במחשב או בטלפון:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs sm:text-sm">
                        לחצו על סמל ההתקנה{" "}
                        <Download className="inline-block w-4 h-4 mx-1 text-primary align-text-bottom" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        נמצא בצד שורת הכתובת של הדפדפן (ב-Chrome, Edge או ספארי)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/40">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-xs sm:text-sm">
                        או מתפריט הדפדפן (⋮) &gt; ״התקן אפליקציה״
                      </p>
                      <p className="text-xs text-muted-foreground">
                        האפליקציה תיפתח בחלון ייעודי ותתווסף לשולחן העבודה / למסך הבית
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 px-4 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                הבנתי, תודה!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

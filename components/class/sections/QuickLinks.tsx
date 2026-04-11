const links = [
  { label: "גוגל קלאסרום", url: "https://classroom.google.com", icon: "/icons/classroom.svg" },
  { label: "משוב תלמידים", url: "https://web.mashov.info/students/main/home", icon: "/icons/mashov.svg" },
  { label: "משוב הורים", url: "https://web.mashov.info/parents/main/home", icon: "/icons/mashov.svg" },
  { label: "אופק", url: "https://students.myofek.cet.ac.il/", icon: "/icons/ofek.svg" },
  { label: "גלים פרו", url: "https://pro.galim.org.il", icon: "/icons/galim.svg" },
  { label: "מודל", url: "https://moodlemoe.lms.education.gov.il/", icon: "/icons/moodle.svg" },
  { label: "אתר בית הספר", url: "https://bengurion-herzliya.mashov.info/", icon: "/icons/school.svg" },
  {
    label: "תקנון בית הספר",
    url: "https://bengurion-herzliya.mashov.info/wp-content/uploads/sites/225/2024/07/%D7%AA%D7%A7%D7%A0%D7%95%D7%9F-%D7%91%D7%99%D7%AA-%D7%94%D7%A1%D7%A4%D7%A8.pdf-6.pdf",
    icon: "/icons/takanon.svg",
  },
];

const featured = {
  label: "שאל את התקנון",
  sublabel: "NotebookLM",
  url: "https://notebooklm.google.com/notebook/5e283b47-066d-4c88-abdb-16f49da9c3c6",
};

export default function QuickLinks() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center py-4 px-3 rounded-xl text-sm font-bold text-foreground bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-center"
          >
            {link.label}
          </a>
        ))}
      </div>

      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center py-5 px-4 rounded-xl font-bold text-foreground border border-purple-500/30 hover:border-purple-400/60 transition-all duration-200 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(109,40,217,0.25) 0%, rgba(67,56,202,0.2) 100%)",
        }}
      >
        <span className="text-base">{featured.label}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{featured.sublabel}</span>
      </a>
    </div>
  );
}

export const defaultState = {
  settings: {
    brandName: "Salta Soluciones",
    tagline: "CONECTA · RESUELVE · CONFIANZA",
    heroTitle: "Encontrá el servicio que necesitás en Salta",
    heroHighlight: "Salta",
    heroSubtitle: "Electricistas, plomeros, técnicos, herreros y muchos servicios más en Salta Capital.",
    searchPlaceholder: "¿Qué servicio necesitás hoy?",
    servicesTitle: "Servicios",
    servicesSubtitle: "Elegí directamente el servicio que necesitás.",
    heroStart: "#061f43",
    heroEnd: "#0a4b8f",
    titleColor: "#ffffff",
    highlightColor: "#35d1ff",
    glow: 65,
    whatsapp: "543872521955",
    logoUrl: "/assets/logo.png",
    showProfessionals: true,
    showProducts: true,
    showRatings: true
  },
  services: [
    { id: "svc-electricista", name: "Electricista", slug: "electricista", description: "Instalaciones y reparaciones", icon: "⚡", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-plomero", name: "Plomero", slug: "plomero", description: "Cañerías y pérdidas", icon: "💧", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-herrero", name: "Herrero", slug: "herrero", description: "Rejas y estructuras", icon: "🛠️", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-soldador", name: "Soldador", slug: "soldador", description: "Trabajos metálicos", icon: "🔥", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-tecnico", name: "Técnico", slug: "tecnico", description: "Electrodomésticos y equipos", icon: "⚙️", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-aire", name: "Aire acondicionado", slug: "aire-acondicionado", description: "Instalación y service", icon: "❄️", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-pintor", name: "Pintor", slug: "pintor", description: "Interior y exterior", icon: "🎨", imageUrl: "", whatsapp: "543872521955", active: true },
    { id: "svc-limpieza", name: "Limpieza", slug: "limpieza", description: "Hogar y comercios", icon: "🧹", imageUrl: "", whatsapp: "543872521955", active: true }
  ],
  professionals: [],
  products: []
};

export const cleanPhone = (value = "") => String(value).replace(/[^0-9]/g, "");
export const slugify = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

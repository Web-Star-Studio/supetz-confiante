import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, VolumeX, Heart, MessageCircle, Share2, Bookmark, Music, Maximize } from "lucide-react";

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const videos = [
  {
    id: 1,
    type: "video",
    src: "https://videos.pexels.com/video-files/4386976/4386976-hd_1080_1920_25fps.mp4",
    author: "@marcia.e.thor",
    description: "Thor lutava contra dermatite há meses. 21 dias com Supet e olha essa pelagem! ✨🐶 #supet",
    likes: "12K",
    comments: "450"
  },
  {
    id: 2,
    type: "video",
    src: "https://videos.pexels.com/video-files/5966380/5966380-hd_1080_1920_30fps.mp4",
    author: "@lucas.golden",
    description: "Ele não pode ver o potinho laranja que já fica maluco. Rotina da manhã sagrada! 🧡",
    likes: "8.5K",
    comments: "312"
  },
  {
    id: 3,
    type: "video",
    src: "https://videos.pexels.com/video-files/8569837/8569837-hd_1080_1920_25fps.mp4",
    author: "@vet.ana.claudia",
    description: "Minha recomendação #1 para imunidade básica de pacientes alérgicos.",
    likes: "25K",
    comments: "1.2K"
  },
  {
    id: 4,
    type: "video",
    src: "https://videos.pexels.com/video-files/5966378/5966378-hd_1080_1920_30fps.mp4",
    author: "@familiauaua",
    description: "Adeus coceira, olá noites de sono tranquilas para nós. 🙏",
    likes: "15K",
    comments: "580"
  }
];

const videoSchemas = videos.map(v => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: `Depoimento Supet — ${v.author}`,
  description: v.description,
  thumbnailUrl: "https://supetz-playful-trust.lovable.app/images/og-image.jpg",
  contentUrl: v.src,
  uploadDate: "2025-01-01",
  inLanguage: "pt-BR",
}));


export default function VideoTestimonials() {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});
  const [activeIndex, setActiveIndex] = useState(0);

  // Play the active slide automatically if it was previously playing
  useEffect(() => {
    // Pause all
    Object.values(videoRefs.current).forEach(vid => {
      if (vid) vid.pause();
    });
    
    // Auto-play the front-and-center video if we want auto-play behavior
    // For now we require explicit interaction to play, enhancing performance
    setPlayingId(null);
  }, [activeIndex]);

  const togglePlay = (id: number) => {
    if (playingId === id) {
      videoRefs.current[id]?.pause();
      setPlayingId(null);
    } else {
      if (playingId !== null) {
        videoRefs.current[playingId]?.pause();
      }
      setTimeout(() => {
        videoRefs.current[id]?.play();
      }, 50);
      setPlayingId(id);
    }
  };

  const handleTimeUpdate = (id: number) => {
    const video = videoRefs.current[id];
    if (!video) return;
    const progress = (video.currentTime / video.duration) * 100;
    const bar = document.getElementById(`progress-${id}`);
    if (bar) {
      bar.style.width = `${progress}%`;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <section className="py-24 md:py-32 bg-[#050505] text-white relative overflow-hidden">
      
      {/* Cinematic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-supet-orange/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-[1400px] px-6 relative z-10">
        
        {/* Section Header */}
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-supet-orange animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Comunidade Supet</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-balance mb-6"
          >
            A revolução não é silenciosa. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-supet-orange to-amber-400 italic font-serif opacity-90">Veja com seus próprios olhos.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-lg md:text-xl font-medium"
          >
            Deslize para assistir os relatos reais de tutores que transformaram a vida dos seus cães com nossa fórmula exclusiva.
          </motion.p>
        </div>

        {/* 3D Coverflow Slider */}
        <div className="w-full relative pb-16">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            initialSlide={1}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            coverflowEffect={{
              rotate: 0,
              stretch: 0,
              depth: 150,
              modifier: 2.5,
              slideShadows: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[EffectCoverflow, Pagination]}
            className="w-full !overflow-visible"
          >
            {videos.map((video, index) => {
              const isPlaying = playingId === video.id;
              const isActive = index === activeIndex;

              return (
                <SwiperSlide key={video.id} className="w-[300px] sm:w-[340px] md:w-[380px] aspect-[9/16] transition-all duration-500">
                  <div 
                    className={`relative w-full h-full rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 transition-all duration-700 
                      ${isActive ? 'shadow-[0_0_80px_rgba(255,107,43,0.15)] ring-white/30' : 'opacity-70 scale-95 grayscale-[30%]'}`}
                    onClick={() => {
                      if (!isActive) return;
                      togglePlay(video.id);
                    }}
                  >
                    
                    {/* Media Layer */}
                    <div className="absolute inset-0 z-0">
                      <video
                        ref={el => { if (el) videoRefs.current[video.id] = el }}
                        src={video.src}
                        className="w-full h-full object-cover"
                        loop
                        muted={isMuted}
                        playsInline
                        onTimeUpdate={() => handleTimeUpdate(video.id)}
                      />
                    </div>

                    {/* Dark Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40 z-10 pointer-events-none" />
                    {!isActive && <div className="absolute inset-0 bg-black/40 z-20 pointer-events-none transition-opacity duration-500" />}
                    
                    {/* Center Play Button */}
                    <AnimatePresence>
                      {isActive && !isPlaying && (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                        >
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-2xl transition-transform hover:scale-105">
                            <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-2 fill-white opacity-90" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Top Controls (Only show when active) */}
                    <div className={`absolute top-6 right-6 flex gap-3 z-40 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                      <button 
                        onClick={toggleMute}
                        className="w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 text-white"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Bottom Left Content */}
                    <div className="absolute bottom-6 left-6 right-20 z-40">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full border border-white/40 overflow-hidden shrink-0">
                          <img src={`https://i.pravatar.cc/100?img=${video.id+20}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <p className="font-extrabold text-base md:text-lg text-white drop-shadow-md">{video.author}</p>
                      </div>
                      <p className="text-sm text-white/90 line-clamp-3 mb-4 leading-relaxed font-medium text-balance drop-shadow-md">
                        {video.description}
                      </p>
                      
                      {/* Music Scroller */}
                      <div className="flex items-center gap-2 text-white/80 bg-black/30 w-fit px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        <Music className="w-[12px] h-[12px] shrink-0 fill-white" />
                        <div className="overflow-hidden w-24 relative h-4">
                          <motion.p 
                            animate={{ x: [0, -100] }} 
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="text-[10px] uppercase font-bold tracking-widest whitespace-nowrap absolute"
                          >
                            Som original - Supet
                          </motion.p>
                        </div>
                      </div>
                    </div>

                    {/* Right Side Column Actions */}
                    <div className="absolute bottom-8 right-5 flex flex-col gap-5 items-center z-40">
                      <div className="flex flex-col items-center gap-1 group/btn">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20 transition-colors">
                          <Heart className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{video.likes}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 group/btn">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20 transition-colors">
                          <MessageCircle className="w-5 h-5 text-white fill-white/20" />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{video.comments}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 group/btn">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 backdrop-blur-md border border-white/10 group-hover/btn:bg-white/20 transition-colors">
                          <Bookmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Salvar</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40">
                      <div 
                        id={`progress-${video.id}`}
                        className="h-full bg-supet-orange transition-all duration-100 ease-linear w-0 shadow-[0_0_10px_rgba(255,107,43,0.8)]" 
                      />
                    </div>

                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Global CSS Overrides for Swiper Pagination */}
        <style>{`
          .swiper-pagination-bullet {
            background: rgba(255,255,255,0.3) !important;
            opacity: 1 !important;
            width: 8px !important;
            height: 8px !important;
            transition: all 0.3s ease !important;
          }
          .swiper-pagination-bullet-active {
            background: #ff6b2b !important;
            width: 24px !important;
            border-radius: 4px !important;
            box-shadow: 0 0 10px rgba(255,107,43,0.5) !important;
          }
        `}</style>
      </div>
    </section>
  );
}

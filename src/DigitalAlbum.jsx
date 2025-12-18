import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Volume2, VolumeX, Edit3, Save, ZoomIn, ChevronLeft, ChevronRight, Loader, Upload } from 'lucide-react';
import { supabase } from './supabaseClient';

// --- 🎨 ZONA DE DISEÑO (Edita esto para cambiar el look) ---
const VISUAL_CONFIG = {
  // Fondos y Texturas
  appBackground: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')", // Fondo de madera de la mesa
  appBackgroundColor: "#d8c8b0", // Color base de la mesa
  
  coverBackground: "#181818", // Color de la tapa del álbum
  coverTexture: "url('https://www.transparenttextures.com/patterns/black-paper.png')", // Textura de la tapa
  
  innerPageBackground: "#1a1a1a", // Color de las páginas interiores
  innerPageTexture: "url('https://www.transparenttextures.com/patterns/black-paper.png')", // Textura interior

  // Textos de la Portada
  coverTitle: "Te Amo",
  coverSubtitle: "Nuestro Primer Año (2024-2025)",
  coverTagline: "Jorge y Rebeca",

  // Colores de Texto
  textColorLight: "#f5f5f5", // Texto principal claro
  textColorDim: "#9ca3af",   // Texto secundario grisáceo
};

// --- COMPONENTES VISUALES ---
const BindingHole = () => (
  <div className="absolute w-3 h-4 rounded-[2px] bg-[#0a0a0a] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]" />
);

const TwinLoopBinding = ({ numBindingRings }) => (
  <div className="absolute left-1/2 top-[5%] bottom-[5%] w-10 -ml-5 flex flex-col justify-between z-50 pointer-events-none py-1">
     {[...Array(numBindingRings)].map((_, i) => (
       <div key={i} className="relative w-full h-8 flex flex-col gap-[3px] items-center justify-center">
          <div className="w-[110%] h-[3px] rounded-full relative shadow-[0_4px_6px_rgba(0,0,0,0.9)]" style={{ background: 'linear-gradient(to bottom, #333 0%, #111 50%, #000 100%)' }}><div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-white opacity-[0.05] rounded-full"></div></div>
          <div className="w-[110%] h-[3px] rounded-full relative shadow-[0_4px_6px_rgba(0,0,0,0.9)]" style={{ background: 'linear-gradient(to bottom, #333 0%, #111 50%, #000 100%)' }}><div className="absolute top-0 left-[20%] right-[20%] h-[1px] bg-white opacity-[0.05] rounded-full"></div></div>
       </div>
     ))}
  </div>
);

const EditableImage = ({ src, pageIndex, imgIndex, className, rotation = "rotate-0", isDevMode, onImageUpload, onImageUrlChange, onZoom }) => {
  const startZoom = () => { if (!isDevMode && onZoom) onZoom(src); };
  const endZoom = () => { if (onZoom) onZoom(null); };
  const stopProp = (e) => e.stopPropagation();

  return (
    <div 
      className={`relative group bg-white shadow-xl p-2 pb-10 transition-all duration-300 hover:z-20 hover:scale-105 ${rotation} ${className} ${!isDevMode ? 'cursor-zoom-in' : ''}`}
      onMouseDown={startZoom} onMouseUp={endZoom} onMouseLeave={endZoom} onTouchStart={startZoom} onTouchEnd={endZoom}
    >
      <div className="w-full h-32 overflow-hidden bg-gray-200 relative">
          {src && <img src={src} className="w-full h-full object-cover pointer-events-none" alt="" />}
      </div>
      {isDevMode && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50 p-2 gap-2 rounded-sm" onMouseDown={stopProp} onTouchStart={stopProp}>
          <label className="cursor-pointer flex flex-col items-center text-white hover:text-green-400 transition-colors">
            <Upload size={20} />
            <span className="text-[10px] uppercase font-bold mt-1">Subir Foto</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImageUpload && onImageUpload(e, pageIndex, imgIndex)} />
          </label>
          <div className="w-full h-[1px] bg-white/20"></div>
          <div className="w-full">
            <input type="text" placeholder="O pega enlace..." className="w-full text-xs text-black px-1 py-1 rounded border-none focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => onImageUrlChange && onImageUrlChange(pageIndex, imgIndex, e.target.value)} onClick={(e) => e.target.select()} />
          </div>
        </div>
      )}
      {!isDevMode && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-40">
              <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1 shadow-lg">
                 <ZoomIn size={12} /><span>Clic para ver</span>
              </div>
          </div>
      )}
    </div>
  );
};

const PageContent = ({ data, side, isCover, pageIndex, isDevMode, handleTextUpdate, handleImageUpload, handleImageUrlChange, setZoomedImage, handleReset }) => {
  const isLeft = side === 'left';
  const numBindingRings = 12; 
  
  // Estilos dinámicos basados en la configuración
  const coverStyle = { backgroundColor: VISUAL_CONFIG.coverBackground };
  const pageStyle = { backgroundColor: VISUAL_CONFIG.innerPageBackground };
  const coverTextureStyle = { backgroundImage: VISUAL_CONFIG.coverTexture };
  const pageTextureStyle = { backgroundImage: VISUAL_CONFIG.innerPageTexture, filter: 'contrast(1.5)' };

  if (isCover) {
      if (isLeft) return ( 
          <div className="w-full h-full flex items-center justify-center relative border-l border-stone-800 p-8 text-center" style={coverStyle}>
              <div className="absolute inset-0 opacity-60" style={coverTextureStyle}></div>
              <div className="relative z-20">
                  <h2 className="text-6xl font-handwriting animate-pulse drop-shadow-lg mb-8" style={{ color: VISUAL_CONFIG.textColorLight }}>{VISUAL_CONFIG.coverTitle}</h2>
                   <button type="button" onClick={handleReset} className="text-[10px] text-gray-400 border border-gray-600 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors tracking-widest uppercase shadow-lg cursor-pointer">Volver a Empezar</button>
              </div>
          </div>
      );
      return ( 
          <div className="w-full h-full flex items-center justify-center relative border-r border-stone-800 p-8" style={coverStyle}>
              <div className="absolute inset-0 opacity-60" style={coverTextureStyle}></div>
              <div className="text-center p-8 border border-white/30 m-8 rounded-sm relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-20">
                  <div className="absolute -top-3 left-1/2 -ml-3 w-6 h-6 bg-[#333] border border-white/20 rounded-full shadow-md"></div>
                   <h1 className="text-5xl font-handwriting leading-tight drop-shadow-lg" style={{ color: VISUAL_CONFIG.textColorLight }}>
                      {VISUAL_CONFIG.coverSubtitle.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                   </h1>
                  <div className="mt-4 text-xs font-handwriting tracking-[0.3em] uppercase opacity-80" style={{ color: VISUAL_CONFIG.textColorDim }}>{VISUAL_CONFIG.coverTagline}</div>
              </div>
          </div>
      );
  }

  if (!data) return <div className="w-full h-full" style={pageStyle}></div>;

  const isOddMonth = pageIndex % 2 === 0;
  const showPhotos = (isOddMonth && isLeft) || (!isOddMonth && !isLeft);
  const photoLayoutVariant = pageIndex % 3;

  const PhotosLayout = (
      <>
      {photoLayoutVariant === 0 && (
          <div className="w-full h-full p-6 relative flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-[80%] rotate-1">
                  <EditableImage src={data.imgs[0]} pageIndex={pageIndex} imgIndex={0} rotation="-rotate-3" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  <EditableImage src={data.imgs[1]} pageIndex={pageIndex} imgIndex={1} rotation="rotate-2" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  <div className="col-span-2 flex justify-center mt-2">
                      <EditableImage src={data.imgs[2]} pageIndex={pageIndex} imgIndex={2} rotation="-rotate-1" className="w-[45%]" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  </div>
              </div>
           </div>
      )}
      {photoLayoutVariant === 1 && (
          <div className="w-full h-full p-6 relative flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-[80%] -rotate-1">
                  <div className="col-span-2 flex justify-center mb-4">
                     <EditableImage src={data.imgs[0]} pageIndex={pageIndex} imgIndex={0} rotation="rotate-1" className="w-[45%]" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  </div>
                  <EditableImage src={data.imgs[1]} pageIndex={pageIndex} imgIndex={1} rotation="-rotate-2" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  <EditableImage src={data.imgs[2]} pageIndex={pageIndex} imgIndex={2} rotation="rotate-3" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
              </div>
           </div>
      )}
      {photoLayoutVariant === 2 && (
          <div className="w-full h-full p-6 relative flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-[80%] rotate-2 items-center">
                  <div className="flex flex-col gap-4">
                      <EditableImage src={data.imgs[0]} pageIndex={pageIndex} imgIndex={0} rotation="-rotate-2" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                      <EditableImage src={data.imgs[1]} pageIndex={pageIndex} imgIndex={1} rotation="rotate-1" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  </div>
                  <div className="flex justify-center h-full items-center">
                       <EditableImage src={data.imgs[2]} pageIndex={pageIndex} imgIndex={2} rotation="-rotate-3" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
                  </div>
              </div>
          </div>
      )}
      </>
  );

  const TextLayout = (
      <div className="w-full h-full p-6 relative flex flex-col items-center">
          <div className="h-[66%] w-full flex flex-col items-center justify-center relative z-10">
              <div className={`w-full flex mb-4 ${isLeft ? 'justify-start pl-2' : 'justify-end pr-2'}`}>
                  {isDevMode ? (
                    <input type="text" value={data.month || ''} onChange={(e) => handleTextUpdate && handleTextUpdate(pageIndex, 'month', e.target.value)} className="bg-transparent border-b border-white/50 font-handwriting text-2xl rotate-[-2deg] w-40 text-right focus:outline-none focus:border-white" style={{ color: VISUAL_CONFIG.textColorLight }}/>
                  ) : (
                    <div className="font-handwriting text-2xl rotate-[-2deg] opacity-70 border-b border-white/20 pb-1" style={{ color: VISUAL_CONFIG.textColorLight }}>{data.month}</div>
                  )}
              </div>
              <div className="flex-grow flex flex-col items-center w-full justify-center px-12">
                  {isDevMode ? (
                    <input type="text" value={data.title || ''} onChange={(e) => handleTextUpdate && handleTextUpdate(pageIndex, 'title', e.target.value)} className="bg-transparent text-3xl font-handwriting mb-4 rotate-1 text-center w-full focus:outline-none border-b border-dashed border-white/30" style={{ color: VISUAL_CONFIG.textColorLight }}/>
                  ) : (
                    <h2 className="text-3xl font-handwriting mb-4 rotate-1 text-center drop-shadow-md" style={{ color: VISUAL_CONFIG.textColorLight }}>{data.title}</h2>
                   )}
                  <div className="relative p-2 w-full">
                      {isDevMode ? (
                        <textarea value={data.caption || ''} onChange={(e) => handleTextUpdate && handleTextUpdate(pageIndex, 'caption', e.target.value)} className="bg-black/20 font-handwriting text-lg text-center leading-loose w-full p-2 rounded focus:outline-none resize-none h-32" style={{ color: '#e8e8e8' }}/>
                      ) : (
                        <p className="font-handwriting text-lg text-center leading-loose" style={{ color: '#e8e8e8' }}>{data.caption}</p>
                       )}
                  </div>
              </div>
          </div>
          <div className="h-[34%] w-full flex justify-center items-center relative z-30">
               <EditableImage src={data.imgs[3]} pageIndex={pageIndex} imgIndex={3} rotation="rotate-3" className="w-[45%]" isDevMode={isDevMode} onImageUpload={handleImageUpload} onImageUrlChange={handleImageUrlChange} onZoom={setZoomedImage} />
          </div>
      </div>
  );

  return (
      <div className="w-full h-full relative overflow-hidden" style={pageStyle}>
          <div className="absolute inset-0 opacity-60 pointer-events-none" style={pageTextureStyle}></div>
          <div className={`absolute top-0 bottom-0 w-24 pointer-events-none z-30 ${isLeft ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black/70 via-white/5 to-transparent`}></div>
          <div className={`absolute top-[5%] bottom-[5%] flex flex-col justify-between py-1 z-40 ${isLeft ? 'right-2' : 'left-2'}`}>
              {[...Array(numBindingRings)].map((_, i) => <div key={i} className="h-8 flex items-center"><BindingHole /></div>)}
          </div>
          {showPhotos ? PhotosLayout : TextLayout}
      </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const DigitalAlbum = () => {
  const [currentSheet, setCurrentSheet] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [isDevMode, setIsDevMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [layoutScale, setLayoutScale] = useState(1);
  const cursorRef = useRef(null);
  const totalSheets = 13; 
  const numBindingRings = 12;
  const FIXED_YOUTUBE_ID = "3y8nGSRTtbA";

  const getImages = (keyword) => [
    `https://source.unsplash.com/random/400x500/?couple,${keyword},1`,
    `https://source.unsplash.com/random/400x500/?love,${keyword},2`,
    `https://source.unsplash.com/random/400x500/?romantic,${keyword},3`,
    `https://source.unsplash.com/random/400x500/?date,${keyword},4`
  ];

  const initialData = [
    { month: 'ENE', fullMonth: 'Enero', title: 'El Comienzo', imgs: getImages('coffee'), caption: 'Aquel café donde el tiempo se detuvo por primera vez.', ticket: 'Cine: Fila 8' },
    { month: 'FEB', fullMonth: 'Febrero', title: 'Nuestras Risas', imgs: getImages('laughing'), caption: 'Descubriendo que tenemos el mismo sentido del humor.', ticket: 'Museo Arte' },
    { month: 'MAR', fullMonth: 'Marzo', title: 'Primera Escapada', imgs: getImages('roadtrip'), caption: 'Perdidos en la carretera, pero encontrándonos.', ticket: 'Peaje Km 40' },
    { month: 'ABR', fullMonth: 'Abril', title: 'Rutinas Dulces', imgs: getImages('home'), caption: 'Domingos de pijama, películas y nada más.', ticket: 'Delivery Pizza' },
    { month: 'MAY', fullMonth: 'Mayo', title: 'Pequeños Detalles', imgs: getImages('gift'), caption: 'Tus notas sorpresa en mi bolsillo.', ticket: 'Florería' },
    { month: 'JUN', fullMonth: 'Junio', title: 'Medio Año', imgs: getImages('celebration'), caption: 'Celebrando seis meses de aventura.', ticket: 'Cena x2' },
    { month: 'JUL', fullMonth: 'Julio', title: 'Nuevos Amigos', imgs: getImages('dinner'), caption: 'Presentaciones oficiales y cenas.', ticket: 'Bar Central' },
    { month: 'AGO', fullMonth: 'Agosto', title: 'El Concierto', imgs: getImages('concert'), caption: 'Gritando canciones hasta quedarnos sin voz.', ticket: 'VIP Access' },
    { month: 'SEP', fullMonth: 'Septiembre', title: 'Otoño Contigo', imgs: getImages('autumn'), caption: 'Colores cálidos y bufandas compartidas.', ticket: 'Tren #504' },
    { month: 'OCT', fullMonth: 'Octubre', title: 'Apoyo Total', imgs: getImages('hugging'), caption: 'Gracias por sostenerme siempre.', ticket: 'Hospital Visita' },
    { month: 'NOV', fullMonth: 'Noviembre', title: 'Planeando', imgs: getImages('planning'), caption: 'Soñando despiertos con el futuro.', ticket: 'Agencia Viajes' },
    { month: 'DIC', fullMonth: 'Diciembre', title: '365 Días', imgs: getImages('anniversary'), caption: 'Un año entero de amor. Solo el prólogo.', ticket: 'Reserva 19:00' },
  ];

  const [albumData, setAlbumData] = useState(initialData);

  // --- SUPABASE: LEER DATOS ---
  // (Lógica intacta tal como pediste)
  useEffect(() => {
    const loadData = async () => {
        const { data, error } = await supabase
            .from('albums')
            .select('content')
            .eq('id', 'main_album')
            .single();
        
        if (data && data.content) {
            setAlbumData(data.content);
        }
    };
    loadData();
  }, []);

  // --- SUPABASE: GUARDAR DATOS ---
  const saveToCloud = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('albums')
        .upsert({ id: 'main_album', content: albumData });

      if (error) throw error;
      setIsDevMode(false);
      alert("¡Guardado exitosamente!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar. Revisa tu consola.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LÓGICA VISUAL Y DE NAVEGACIÓN ---
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  useLayoutEffect(() => {
    const handleResize = () => {
      const scale = Math.min((window.innerWidth - 20) / 1200, (window.innerHeight - 20) / 700, 1);
      setLayoutScale(scale);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTextUpdate = (index, field, value) => {
    const newData = [...albumData];
    newData[index] = { ...newData[index], [field]: value };
    setAlbumData(newData);
  };

  const handleImageUpload = async (e, pageIndex, imgIndex) => {
    const file = e.target.files[0];
    if (file) {
      const base64Image = await resizeImage(file);
      const newData = [...albumData];
      const newImgs = [...newData[pageIndex].imgs];
      newImgs[imgIndex] = base64Image;
      newData[pageIndex] = { ...newData[pageIndex], imgs: newImgs };
      setAlbumData(newData);
    }
  };

  const handleImageUrlChange = (pageIndex, imgIndex, url) => {
      const newData = [...albumData];
      const newImgs = [...newData[pageIndex].imgs];
      newImgs[imgIndex] = url;
      newData[pageIndex] = { ...newData[pageIndex], imgs: newImgs };
      setAlbumData(newData);
  };

  useEffect(() => {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) return;
    const moveCursor = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  const toggleMusic = () => { setIsPlaying(!isPlaying); };
  const activateAudio = () => { if (!isPlaying) setIsPlaying(true); };

  const getTransitionDuration = (index, isCover) => {
    if (isCover) return 1400;
    if (index === 1) return 600; 
    return 2000; 
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    activateAudio();
    if (isDevMode) return;
    if (currentSheet < totalSheets && !isAnimating) {
      setIsAnimating(true);
      const nextSheet = currentSheet + 1;
      const isCover = nextSheet === totalSheets; 
      const duration = getTransitionDuration(nextSheet - 1, isCover);
      setCurrentSheet(nextSheet);
      setTimeout(() => setIsAnimating(false), duration);
    }
  };

  const handlePrev = (e) => {
    if (e) e.preventDefault();
    activateAudio();
    if (isDevMode) return;
    if (currentSheet > 0 && !isAnimating) {
      setIsAnimating(true);
      const prevSheet = currentSheet - 1;
      const isCover = prevSheet === 0;
      const duration = getTransitionDuration(prevSheet, isCover);
      setCurrentSheet(prevSheet);
      setTimeout(() => setIsAnimating(false), duration);
    }
  };

  const jumpToMonth = (e) => {
      const target = parseInt(e.target.value);
      activateAudio();
      if (!isAnimating && target !== currentSheet) {
          setIsAnimating(true);
          setCurrentSheet(target);
          setTimeout(() => setIsAnimating(false), 2000);
      }
  };

  const handleReset = (e) => {
      e.stopPropagation(); 
      activateAudio();
      if (!isAnimating) {
        setIsAnimating(true);
        setCurrentSheet(0);
        setTimeout(() => setIsAnimating(false), 2200); 
      }
  };

  const renderSheets = () => {
      let sheets = [];
      for (let i = 0; i < totalSheets; i++) {
          let FrontComp, BackComp;
          let zIndex = i < currentSheet ? i : totalSheets - i;
          const isCover = i === 0 || i === totalSheets - 1;
          const isFirstInner = i === 1;
          const isPeeling = isAnimating && i === currentSheet - 1; 
          const dataIndex = i - 1;
          if (i === 0) {
              FrontComp = <PageContent side="right" isCover={true} isDevMode={isDevMode} handleReset={handleReset} />;
              BackComp = <PageContent data={albumData[0]} side="left" pageIndex={0} isDevMode={isDevMode} handleTextUpdate={handleTextUpdate} handleImageUpload={handleImageUpload} handleImageUrlChange={handleImageUrlChange} setZoomedImage={setZoomedImage} />;
          } else if (i === totalSheets - 1) {
              FrontComp = <PageContent data={albumData[11]} side="right" pageIndex={11} isDevMode={isDevMode} handleTextUpdate={handleTextUpdate} handleImageUpload={handleImageUpload} handleImageUrlChange={handleImageUrlChange} setZoomedImage={setZoomedImage} />;
              BackComp = <PageContent side="left" isCover={true} isDevMode={isDevMode} handleReset={handleReset} />;
          } else {
              FrontComp = <PageContent data={albumData[dataIndex]} side="right" pageIndex={dataIndex} isDevMode={isDevMode} handleTextUpdate={handleTextUpdate} handleImageUpload={handleImageUpload} handleImageUrlChange={handleImageUrlChange} setZoomedImage={setZoomedImage} />;
              BackComp = <PageContent data={albumData[dataIndex + 1]} side="left" pageIndex={dataIndex + 1} isDevMode={isDevMode} handleTextUpdate={handleTextUpdate} handleImageUpload={handleImageUpload} handleImageUrlChange={handleImageUrlChange} setZoomedImage={setZoomedImage} />;
          }

          let transitionDuration = '2000ms';
          if (isCover) transitionDuration = '1400ms';
          if (isFirstInner) transitionDuration = '600ms';

          sheets.push(
              <div key={i} className="absolute top-0 w-1/2 h-full transform-style-3d" style={{ left: 'calc(50% + 10px)', transformOrigin: '-10px center', zIndex: zIndex, transition: `transform ${transitionDuration} cubic-bezier(0.2, 0.8, 0.2, 1)`, transform: i < currentSheet ? 'rotateY(-180deg)' : 'rotateY(0deg)', }}>
                   <div className="absolute inset-0 backface-hidden overflow-hidden rounded-r-md border-r border-stone-800" style={{ backfaceVisibility: 'hidden', backgroundColor: VISUAL_CONFIG.innerPageBackground }}>
                      {FrontComp}
                      {!isCover && <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000" style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(0,0,0,0.4) 60%, transparent 80%)', opacity: isPeeling ? 1 : 0 }} />}
                  </div>
                  <div className="absolute inset-0 backface-hidden overflow-hidden rounded-l-md border-l border-stone-800" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: VISUAL_CONFIG.innerPageBackground }}>
                      {BackComp}
                  </div>
               </div>
          );
      }
      return sheets;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative cursor-none" 
         style={{ backgroundImage: VISUAL_CONFIG.appBackground, backgroundColor: VISUAL_CONFIG.appBackgroundColor, backgroundBlendMode: 'multiply' }}>
      {isPlaying && (
        <div className="absolute top-0 left-0 w-[1px] h-[1px] opacity-0 overflow-hidden pointer-events-none">
            <iframe key={FIXED_YOUTUBE_ID} width="1" height="1" src={`https://www.youtube.com/embed/${FIXED_YOUTUBE_ID}?autoplay=1&loop=1&playlist=${FIXED_YOUTUBE_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`} title="YouTube audio" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
        </div>
      )}
      <div ref={cursorRef} className={`fixed top-0 left-0 w-6 h-6 rounded-full bg-slate-400/80 backdrop-blur-sm pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 shadow-sm transition-transform duration-75 ease-out lg:block hidden`} style={{ mixBlendMode: 'difference' }}></div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Caveat:wght@400;700&display=swap');
        .font-handwriting { font-family: 'Patrick Hand', cursive; }
        .perspective-container { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-2 cursor-auto">
        {isDevMode && (
            <div className="bg-black/80 text-white p-4 rounded-md mb-2 animate-fade-in flex flex-col gap-2 w-64 shadow-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Edición</span>
                 <span className="text-xs text-gray-400">Haz clic en textos o fotos para editar. Puedes subir archivos o pegar enlaces.</span>
            </div>
        )}
        <button type="button" onClick={isDevMode ? saveToCloud : () => setIsDevMode(true)} className={`p-3 rounded-full shadow-lg transition-all flex items-center gap-2 cursor-pointer ${isDevMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-stone-800 text-white hover:bg-stone-900'}`} title="Activar modo edición" disabled={isSaving}>
            {isSaving ? <><Loader className="animate-spin" size={20} /> Guardando...</> : isDevMode ? <><Save size={20} /> Guardar</> : <><Edit3 size={20} /> Modo Desarrollador</>}
        </button>
      </div>

      <div className="fixed top-6 right-6 z-[60] flex items-center gap-3">
          <button type="button" onClick={toggleMusic} className={`p-3 rounded-full border shadow-sm cursor-pointer transition-all ${isPlaying ? 'bg-white/30 text-stone-800 border-white/50 hover:bg-white hover:text-black' : 'bg-stone-800/50 text-white/50 border-white/20 hover:bg-stone-800 hover:text-white'}`}>
              {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
      </div>

      {!isDevMode && (
        <>
          <button type="button" onClick={handlePrev} disabled={currentSheet === 0 || isAnimating} className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-[80] p-2 md:p-4 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md text-stone-800 shadow-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95 cursor-auto">
            <ChevronLeft size={32} />
          </button>
          <button type="button" onClick={handleNext} disabled={currentSheet === totalSheets || isAnimating} className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-[80] p-2 md:p-4 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md text-stone-800 shadow-xl transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95 cursor-auto">
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="perspective-container relative w-full h-screen flex items-center justify-center p-4 overflow-hidden">
          <div style={{ transform: `scale(${layoutScale})` }} className="origin-center transition-transform duration-300 ease-out">
              <div className={`relative w-[1100px] aspect-[2.5/1.3] transition-all duration-[1200ms] cubic-bezier(0.25, 1, 0.5, 1) ${(currentSheet > 0 && currentSheet < totalSheets) ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]' : 'shadow-none'}`}>
                  <TwinLoopBinding numBindingRings={numBindingRings} />
                  {renderSheets()}
              </div>
          </div>
      </div>
      {zoomedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none animate-in fade-in duration-200">
           <img src={zoomedImage} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-md transform scale-105" alt="Zoomed" />
        </div>
      )}
      <div className="fixed bottom-6 z-[60] flex flex-col items-center pointer-events-none w-full">
          <div className="pointer-events-auto">
            <select 
                value={currentSheet} 
                onChange={jumpToMonth}
                className="appearance-none bg-stone-800/80 border border-stone-600 text-stone-200 py-2 px-8 rounded-full font-handwriting text-sm focus:outline-none hover:border-white transition-colors backdrop-blur-md shadow-lg cursor-pointer"
                disabled={isDevMode}
            >
                <option value={0}>Inicio</option>
                {albumData.map((d, i) => <option key={i} value={i + 1}>{d.fullMonth}</option>)}
                <option value={totalSheets}>Final</option>
            </select>
          </div>
      </div>
    </div>
  );
};

export default DigitalAlbum;
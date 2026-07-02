import React from 'react';
import TeamLogo from '../ui/TeamLogo';

const PlayerDetailsWidget = ({ player }) => {
  if (!player) return null;

  const nameParts = [player.FirstName, player.LastName].filter(Boolean);
  const displayName = nameParts.length > 0 ? nameParts.join(' ') : (player.PlayerName || player.Nombre || player.Name || 'Jugador');

  const photoSrc = player.PhotoURL || 'https://images.fifaindex.com/fifa22/players/205340.png';

  return (
    <div className="flex flex-col h-full bg-white animate-slide-up relative">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-stone-800 to-stone-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay"></div>
      </div>
      
      <div className="relative z-10 px-8 pt-24 pb-8 flex flex-col items-center border-b border-stone-200">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-stone-100 flex items-center justify-center">
          <img 
            src={photoSrc} 
            alt={displayName} 
            className="w-full h-full object-cover" 
            onError={(e) => { e.target.src = 'https://images.fifaindex.com/fifa22/players/205340.png'; }}
          />
        </div>
        <h2 className="mt-4 text-3xl font-black text-stone-900 tracking-tight text-center">{displayName}</h2>
        <div className="flex items-center gap-2 mt-2">
           {player.CategoryName && (
            <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-semibold border border-stone-200">
              {player.CategoryName}
            </span>
          )}
          <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-semibold border border-orange-200/50">
            {player.Position || 'N/A'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-black text-orange-400 mb-1">{player.JerseyNumber || '-'}</div>
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">Dorsal</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <TeamLogo 
              src={player.TeamLogoURL} 
              alt={player.TeamName || `Equipo ${player.TeamID}`}
              className="w-12 h-12 rounded-full mb-2 shadow-sm"
              fallbackClassName="w-12 h-12 rounded-full mb-2 shadow-sm text-xl"
            />
            <div className="text-sm font-bold text-stone-700 leading-tight break-words">{player.TeamName || `Equipo ${player.TeamID}`}</div>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-1">Equipo</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailsWidget;

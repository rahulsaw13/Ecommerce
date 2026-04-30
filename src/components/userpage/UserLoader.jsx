const UserLoader = () => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white">
      <div className="relative flex items-center justify-center">
        {/* Animated Yellow Squares */}
        <div className="relative w-16 h-16 md:w-24 md:h-24">
          {/* First Square */}
          <div 
            className="absolute w-8 h-8 md:w-12 md:h-12 border-2 md:border-4 border-yellow-400 bg-transparent"
            style={{
              top: '0',
              left: '0',
              animation: 'square1 1.5s ease-in-out infinite'
            }}
          ></div>
          
          {/* Second Square */}
          <div 
            className="absolute w-8 h-8 md:w-12 md:h-12 border-2 md:border-4 border-yellow-400 bg-transparent"
            style={{
              bottom: '0',
              right: '0',
              animation: 'square2 1.5s ease-in-out infinite'
            }}
          ></div>
        </div>
      </div>

      <style>{`
        @keyframes square1 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(16px, 0) rotate(90deg);
          }
          50% {
            transform: translate(16px, 16px) rotate(180deg);
          }
          75% {
            transform: translate(0, 16px) rotate(270deg);
          }
        }

        @keyframes square2 {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(-16px, 0) rotate(-90deg);
          }
          50% {
            transform: translate(-16px, -16px) rotate(-180deg);
          }
          75% {
            transform: translate(0, -16px) rotate(-270deg);
          }
        }

        @media (min-width: 768px) {
          @keyframes square1 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
            }
            25% {
              transform: translate(24px, 0) rotate(90deg);
            }
            50% {
              transform: translate(24px, 24px) rotate(180deg);
            }
            75% {
              transform: translate(0, 24px) rotate(270deg);
            }
          }

          @keyframes square2 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
            }
            25% {
              transform: translate(-24px, 0) rotate(-90deg);
            }
            50% {
              transform: translate(-24px, -24px) rotate(-180deg);
            }
            75% {
              transform: translate(0, -24px) rotate(-270deg);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default UserLoader;

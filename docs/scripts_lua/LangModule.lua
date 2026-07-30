local Lang = {}

Lang.strings = {
    ["en-US"] = {
        start = "Start",
        restart = "Restart",
        instructions = "Use ↑/↓ (W/S) to move vertically. Use ←/→ to move forward/back. Space to rotate. D to shoot.",
        score = "Score",
        saved = "Saved",
        lost = "Lost",
        gameOver = "Game Over",
        playAgain = "Play Again",
        ready = "Ready"
    },
    ["pt-BR"] = {
        start = "Iniciar",
        restart = "Reiniciar",
        instructions = "Use ↑/↓ (W/S) para mover verticalmente. Use ←/→ para frente/atrás. Espaço para girar. D para atirar.",
        score = "Pontos",
        saved = "Salvos",
        lost = "Perdidos",
        gameOver = "Fim de Jogo",
        playAgain = "Jogar Novamente",
        ready = "Pronto"
    },
    ["es-ES"] = {
        start = "Iniciar",
        restart = "Reiniciar",
        instructions = "Usa ↑/↓ (W/S) para mover verticalmente. Usa ←/→ para adelante/atrás. Espacio para girar. D para disparar.",
        score = "Puntos",
        saved = "Rescatados",
        lost = "Perdidos",
        gameOver = "Juego Terminado",
        playAgain = "Jugar Otra Vez",
        ready = "Listo"
    }
}

function Lang.get(langCode, key)
    local t = Lang.strings[langCode] or Lang.strings["en-US"]
    return t[key] or ""
end

return Lang

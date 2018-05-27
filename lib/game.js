module.exports = () => {
  const thresholds = [0, 0, 5, 30, 90, 150, 230, 280, 350, 450]
  var updateCallback = () => {}
  var dotsId = 0
  var state = {
    dots: [],
    score: 0,
    highScore: 0,
    floatingDots: [newDot(4, 1), newDot(5, 0)],
    level: 2,
    blocksKilled: 0
  }

  const colors = [
    '#4CDC00',
    '#FDD401',
    '#DB7D1B',
    '#DD2C2C',
    '#EE519F',
    '#AC32AF',
    '#314FFF',
    '#0EC5EC',
    '#131313',
    '#E9E9E9'
  ]

  function setState (newState) {
    Object.assign(state, newState)
    updateCallback(newState)
  }

  function newDot (x, level) {
    return newDotAt(x, -1, level)
  }

  function newDotAt (x, y, level) {
    return {
      x,
      y,
      key: dotsId++,
      type:
        level !== undefined ? level : Math.floor(Math.random() * state.level)
    }
  }

  function moveDotsLeft () {
    if (state.floatingDots.reduce((min, d) => Math.min(d.x, min), 7) === 0) {
      return
    }
    setState({
      ...state,
      floatingDots: state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x - 1
        }
      })
    })
  }

  function settleDots (dots) {
    const newMap = {}
    for (let i = 0; i < 7; i++) {
      newMap[i] = {}
      for (let j = -1; j < 7; j++) {
        newMap[i][j] = null
      }
    }
    dots.forEach(d => {
      newMap[d.x][d.y] = d
    })
    for (let i = 0; i < 7; i++) {
      var firstFree = null
      for (let j = 6; j >= -1; j--) {
        if (!newMap[i][j] && firstFree === null) {
          firstFree = j
        }
        if (newMap[i][j] && firstFree !== null) {
          newMap[i][j].y = firstFree--
        }
      }
    }
    return [...dots]
  }

  function cleanupDots (dots, cb) {
    const map = {}
    const keep = {}
    for (let i = 0; i < 7; i++) {
      map[i] = {}
      keep[i] = {}
      for (let j = -1; j < 7; j++) {
        map[i][j] = null
        keep[i][j] = true
      }
    }
    dots.forEach(d => {
      map[d.x][d.y] = d
    })
    const checkTile = d => {
      if (!d) return []
      map[d.x][d.y] = null
      return [
        map[d.x >= 6 ? 6 : d.x + 1][d.y],
        map[d.x <= 0 ? 0 : d.x - 1][d.y],
        map[d.x][d.y >= 6 ? 6 : d.y + 1],
        map[d.x][d.y <= 0 ? 0 : d.y - 1]
      ]
        .filter(n => n && n.type === d.type)
        .reduce((l, d) => l.concat(checkTile(d)), [])
        .concat([d])
    }
    let freshDots = []
    for (let i = 0; i < 7; i++) {
      for (let j = -1; j < 7; j++) {
        const l = checkTile(map[i][j])
        if (l.length > 2) {
          const newColoredDot = l.reduce(
            (min, d) => {
              if (d.y > min.y) return d
              if (d.y === min.y && d.x < min.x) return d
              return min
            },
            { x: 10, y: -2 }
          )

          if (newColoredDot.type < colors.length - 1) {
            freshDots.push(
              newDotAt(newColoredDot.x, newColoredDot.y, newColoredDot.type + 1)
            )
          }
          l.forEach((d, i) => {
            keep[d.x][d.y] = false
            updateScore(state.score + (newColoredDot.type + 1) * 5)
          })
          state.blocksKilled++
        }
      }
    }

    const newDots = dots.filter(d => keep[d.x][d.y]).concat(freshDots)
    return newDots
  }

  function updateScore (score) {
    if (typeof window === 'undefined') return
    const highScore = Math.max(score, state.highScore)
    window.localStorage['score'] = highScore
    setState({ highScore, score })
  }

  function moveDotsRight () {
    if (state.floatingDots.reduce((max, d) => Math.max(d.x, max), 0) === 6) {
      return
    }
    setState({
      ...state,
      floatingDots: state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x + 1
        }
      })
    })
  }

  function pushDots () {
    const floatingDots = state.floatingDots
    if (!floatingDots.length) return
    const inactiveDots = state.dots
    const newDots = floatingDots.map(d => {
      const dotsInSameCol = inactiveDots
        .filter(id => id.x === d.x)
        .map(d => d.y)
      if (dotsInSameCol.length) {
        return {
          ...d,
          y: Math.min(...dotsInSameCol) + d.y
        }
      } else {
        return {
          ...d,
          y: 7 + d.y
        }
      }
    })
    setState({
      ...state,
      dots: inactiveDots.concat(newDots),
      floatingDots: []
    })
    setTimeout(() => cleanupBoard([], state.dots), 300)
  }

  function cleanupBoard (oldRun, newRun) {
    oldRun = newRun
    newRun = cleanupDots(oldRun)
    const level = thresholds.findIndex(l => l > state.blocksKilled)
    setState({
      ...state,
      level: level < 0 ? colors.length - 1 : level,
      dots: newRun
    })
    if (oldRun.length === newRun.length) {
      if (newRun.some(d => d.y < 0)) {
        return setState({
          gameover: true,
          dots: [],
          floatingDots: []
        })
      }
      return setState({
        ...state,
        floatingDots: [newDot(4), newDot(5)]
      })
    }
    setTimeout(() => {
      newRun = settleDots(newRun)
      setState({
        ...state,
        dots: newRun
      })
      setTimeout(() => cleanupBoard(oldRun, newRun), 300)
    }, 300)
  }

  function rotateDots () {
    const dots = state.floatingDots
    if (!dots.length) return
    var newFloatingDots
    if (dots[0].y === dots[1].y) {
      if (dots[0].x < dots[1].x) {
        newFloatingDots = [
          {
            ...dots[0],
            y: dots[1].y - 1,
            x: dots[1].x
          },
          dots[1]
        ]
      } else {
        newFloatingDots = [
          dots[0],
          {
            ...dots[1],
            y: dots[0].y - 1,
            x: dots[0].x
          }
        ]
      }
    } else {
      if (dots[0].y < dots[1].y) {
        newFloatingDots = [
          {
            ...dots[0],
            x: dots[1].x,
            y: dots[1].y
          },
          {
            ...dots[1],
            x: dots[1].x - 1,
            y: dots[1].y
          }
        ]
      } else {
        newFloatingDots = [
          {
            ...dots[0],
            x: dots[0].x - 1,
            y: dots[0].y
          },
          {
            ...dots[1],
            x: dots[0].x,
            y: dots[0].y
          }
        ]
      }
    }
    if (newFloatingDots[0].x < 0 || newFloatingDots[1].x < 0) {
      newFloatingDots = newFloatingDots.map(d => ({
        ...d,
        x: d.x + 1
      }))
    }
    setState({
      ...state,
      floatingDots: newFloatingDots
    })
  }

  return {
    onUpdate: cb => {
      updateCallback = cb
    },
    moveDotsLeft,
    moveDotsRight,
    rotateDots,
    pushDots,

    setHighScore: highScore => setState({ highScore }),

    colors: () => colors,
    balls: () =>
      state.dots.concat(state.floatingDots.map(i => ({ ...i, outside: true }))),
    gameover: () => state.gameover,
    level: () => state.level,
    score: () => state.score,
    highScore: () => state.highScore
  }
}
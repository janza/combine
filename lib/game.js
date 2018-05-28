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

const levelUpAt = [0, 0, 5, 30, 90, 150, 230, 280, 350, 450]

var dotsId = 0

const ball = (x, y, level, id) => {
  const key = id || dotsId++
  return {
    x,
    y,
    type: level,
    key
  }
}

const pendingBalls = (leftLevel, rightLevel) => {
  var rotation = 0
  var position = 5

  const left = ball(0, 0, leftLevel)
  const right = ball(0, 0, rightLevel)

  const isVertical = () => rotation === 1 || rotation === 3

  function moveLeft () {
    position = Math.max(0, position - 1)
  }

  function moveRight () {
    position = Math.min(6, position + 1)
  }

  function rotate () {
    rotation = (rotation + 1) % 4
  }

  function toArray () {
    const x = Math.max(isVertical() ? 0 : 1, position)
    const y = -1
    switch (rotation) {
      case 0:
        return [{ ...left, x: x - 1, y }, { ...right, x, y }]
      case 2:
        return [{ ...left, x, y }, { ...right, x: x - 1, y }]
      case 1:
        return [{ ...left, x, y: y - 1 }, { ...right, x, y }]
      case 3:
        return [{ ...left, x, y }, { ...right, x, y: y - 1 }]
    }
  }

  return {
    getBalls: () => toArray().map(b => ({ ...b, outside: true })),
    mergeWithPending: balls => {
      return balls.concat(
        toArray().map(b => {
          const dotsInSameCol = balls.filter(id => id.x === b.x)
          const y = Math.min(7, ...dotsInSameCol.map(d => d.y)) + b.y
          return { ...b, y }
        })
      )
    },
    moveLeft,
    moveRight,
    rotate
  }
}

const game = (getBallLevel, sleepFunction, gameBoard) => {
  getBallLevel = getBallLevel || (level => Math.floor(Math.random() * level))
  sleepFunction = sleepFunction || (cb => setTimeout(cb, 300))

  var blocksKilled = 0
  var updateCallback = () => {}
  var queuedUpdate = null
  var pending = pendingBalls(1, 0)
  var state = {
    dots: [],
    score: 0,
    highScore: 0,
    level: 2
  }

  if (gameBoard) {
    state.dots = boardToDots(gameBoard)
  }

  function boardToDots (board) {
    const dots = []
    board = board.split('\n').map(l => l.split(''))
    for (var x = 0; x < 7; x++) {
      for (var y = 0; y < 7; y++) {
        if (board[y][x] !== '.') {
          dots.push(ball(x, y, parseInt(board[y][x])))
        }
      }
    }
    return dots
  }

  function queueUpdate () {
    if (queuedUpdate) return
    queuedUpdate = setTimeout(() => {
      updateCallback(state)
      queuedUpdate = null
    })
  }

  function setState (newState) {
    state = Object.assign({}, state, newState)
    queueUpdate()
  }

  function moveDotsLeft () {
    if (pending) pending.moveLeft()
    queueUpdate()
  }

  function moveDotsRight () {
    if (pending) pending.moveRight()
    queueUpdate()
  }

  function rotateDots () {
    if (pending) pending.rotate()
    queueUpdate()
  }

  function pushDots () {
    if (!pending) return
    const newDots = pending.mergeWithPending(state.dots)
    setState({ dots: newDots })
    pending = null
    sleepFunction(() => cleanupBoard([], newDots))
  }

  function board (dots) {
    const board = {}
    for (let i = 0; i < 7; i++) {
      board[i] = {}
      for (let j = -1; j < 7; j++) {
        board[i][j] = null
      }
    }
    dots.forEach(d => {
      board[d.x][d.y] = d
    })
    return board
  }

  function settleDots (dots) {
    const dotAt = board(dots)
    for (let i = 0; i < 7; i++) {
      var firstFree = null
      for (let j = 6; j >= -1; j--) {
        if (!dotAt[i][j] && firstFree === null) {
          firstFree = j
        }
        if (dotAt[i][j] && firstFree !== null) {
          dotAt[i][j].y = firstFree--
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
              ball(newColoredDot.x, newColoredDot.y, newColoredDot.type + 1)
            )
          }
          l.forEach((d, i) => {
            keep[d.x][d.y] = false
            updateScore(state.score + (newColoredDot.type + 1) * 5)
          })
          blocksKilled++
        }
      }
    }

    return dots.filter(d => keep[d.x][d.y]).concat(freshDots)
  }

  function updateScore (score) {
    const highScore = Math.max(score, state.highScore)
    setState({ score, highScore })
    if (typeof window === 'undefined') return
    window.localStorage['score'] = highScore
  }

  function cleanupBoard (oldRun, newRun) {
    oldRun = newRun
    newRun = cleanupDots(oldRun)
    const level = levelUpAt.findIndex(l => l > blocksKilled)
    setState({
      level: level < 0 ? colors.length - 1 : level,
      dots: newRun
    })
    if (oldRun.length === newRun.length) {
      if (newRun.some(d => d.y < 0)) {
        return setState({
          gameover: true,
          dots: []
        })
      }
      pending = pendingBalls(
        getBallLevel(state.level),
        getBallLevel(state.level)
      )
      return
    }

    sleepFunction(() => {
      newRun = settleDots(newRun)
      setState({
        dots: newRun
      })
      sleepFunction(() => cleanupBoard(oldRun, newRun))
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
    balls: () => (pending ? state.dots.concat(pending.getBalls()) : state.dots),
    gameover: () => state.gameover,
    level: () => state.level,
    score: () => state.score,
    highScore: () => state.highScore
  }
}
module.exports = game

import KeyHandler, {KEYDOWN} from 'react-key-handler'
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
import React from 'react'

const width = 500

const colors = [
  '#ffd600',
  '#00c853',
  '#aa00ff',
  '#d50000',
  '#ff6d00',
  '#c51162',
  '#212121',
  '#263238'
]

const thresholds = [0, 0, 5, 30, 90, 150, 230, 280]

var dotsId = 0

const Dot = ({x, y, type, floating}) => (
  <div
    style={{
      position: 'absolute',
      transition: !floating ? 'top 0.4s, left 0.06s linear' : '0.1s',
      left: `${width / 7 * x}px`,
      top: `${width / 7 * y}px`,
      background: colors[type],
      borderRadius: '50%',
      width: `${width / 7}px`,
      height: `${width / 7}px`
    }}
  />
)

const Levels = ({current}) => {
  return <div style={{
    position: 'absolute',
    left: `-${width / colors.length + 10}px`,
    top: 0,
    display: 'flex',
    flexDirection: 'column-reverse'
  }}>
    {colors.map((c, i) => {
      return <div key={c} style={{
        background: c,
        opacity: current >= i ? 1 : 0.2,
        width: `${width / colors.length}px`,
        height: `${width / colors.length}px`
      }} />
    })}
  </div>
}

class Page extends React.Component {
  constructor (props) {
    super()
    this.state = {
      dots: [],
      floatingDots: [this.newDot(4, 1), this.newDot(5, 0)],
      level: 2,
      blocksKilled: 0
    }
  }
  newDot (x, level) {
    return this.newDotAt(x, -1, level)
  }
  newDotAt (x, y, level) {
    return {
      x,
      y,
      key: dotsId++,
      type: level !== undefined
        ? level
        : Math.floor(Math.random() * this.state.level)
    }
  }
  moveDotsLeft () {
    if (
      this.state.floatingDots.reduce((min, d) => Math.min(d.x, min), 7) === 0
    ) {
      return
    }
    this.setState({
      ...this.state,
      floatingDots: this.state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x - 1
        }
      })
    })
  }

  settleDots (dots) {
    const newMap = Array.from({length: 7}).map(_ =>
      Array.from({length: 7}).map(_ => null)
    )
    dots.forEach(d => {
      newMap[d.x][d.y] = d
    })
    for (let i = 0; i < 7; i++) {
      var firstFree = null
      for (let j = 6; j >= 0; j--) {
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

  cleanupDots (dots, cb) {
    const map = Array.from({length: 7}).map(_ =>
      Array.from({length: 7}).map(_ => null)
    )
    const keep = Array.from({length: 7}).map(_ =>
      Array.from({length: 7}).map(_ => true)
    )
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
      for (let j = 0; j < 7; j++) {
        const l = checkTile(map[i][j])
        if (l.length > 2) {
          const newColoredDot = l.reduce((min, d) => {
            if (d.y > min.y) return d
            if (d.y === min.y && d.x < min.x) return d
            return min
          }, {x: 10, y: -1})

          freshDots.push(
            this.newDotAt(
              newColoredDot.x,
              newColoredDot.y,
              newColoredDot.type + 1
            )
          )
          l.forEach((d, i) => {
            keep[d.x][d.y] = false
          })
          this.state.blocksKilled++
        }
      }
    }

    const newDots = dots.filter(d => keep[d.x][d.y]).concat(freshDots)
    return newDots
  }
  findAt (x, y) {
    return this.state.dots.filter(d => d.x === x && d.y === y)[0] || {}
  }
  moveDotsRight () {
    if (
      this.state.floatingDots.reduce((max, d) => Math.max(d.x, max), 0) === 6
    ) {
      return
    }
    this.setState({
      ...this.state,
      floatingDots: this.state.floatingDots.map(d => {
        return {
          ...d,
          x: d.x + 1
        }
      })
    })
  }
  gameOver () {
    this.setState({
      gameover: true,
      dots: [],
      floatingDots: []
    })
  }
  pushDots () {
    const floatingDots = this.state.floatingDots
    if (!floatingDots.length) return
    const inactiveDots = this.state.dots
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
    if (newDots.some(d => d.y < 0)) return this.gameOver()
    this.setState({
      ...this.state,
      dots: inactiveDots.concat(newDots),
      floatingDots: []
    })
    setTimeout(() => this.cleanupBoard([], this.state.dots), 300)
  }

  cleanupBoard (oldRun, newRun) {
    oldRun = newRun
    newRun = this.cleanupDots(oldRun)
    const level = thresholds.findIndex(l => l > this.state.blocksKilled)
    this.setState({
      ...this.state,
      level: level < 0 ? colors.length - 1 : level,
      dots: newRun
    })
    if (oldRun.length === newRun.length) {
      return this.setState({
        ...this.state,
        floatingDots: [this.newDot(4), this.newDot(5)]
      })
    }
    setTimeout(() => {
      newRun = this.settleDots(newRun)
      this.setState({
        ...this.state,
        dots: newRun
      })
      setTimeout(() => this.cleanupBoard(oldRun, newRun), 300)
    }, 300)
  }

  rotateDots () {
    const dots = this.state.floatingDots
    if (!dots.length) return
    if (dots[0].y === dots[1].y) {
      if (dots[0].x < dots[1].x) {
        return this.setState({
          ...this.state,
          floatingDots: [
            {
              ...dots[0],
              y: dots[1].y - 1,
              x: dots[1].x
            },
            dots[1]
          ]
        })
      }
      return this.setState({
        ...this.state,
        floatingDots: [
          dots[0],
          {
            ...dots[1],
            y: dots[0].y - 1,
            x: dots[0].x
          }
        ]
      })
    }
    if (dots[0].y < dots[1].y) {
      return this.setState({
        ...this.state,
        floatingDots: [
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
      })
    }
    this.setState({
      ...this.state,
      floatingDots: [
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
    })
  }
  render () {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'fixed',
          background: '#f5f5f5',
          margin: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        <style jsx global>{`
.example-enter {
  transform: scale(1.7);
  border-radius: 0% !important;
  opacity: 0.01;
  z-index: 2;
}

.example-enter.example-enter-active {
  opacity: 1;
  transform: scale(1);
  border-radius: 50% !important;
  transition: 0.3s !important;
  z-index: 2;
}

.example-leave {
  opacity: 1;
}

.example-leave.example-leave-active {
  opacity: 0.01;
  border-radius: 0% !important;
  transform: scale(0.7);
  transition: 0.4s !important;
}
        `}</style>

        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowDown'
          onKeyHandle={() => this.pushDots()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowLeft'
          onKeyHandle={() => this.moveDotsLeft()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowRight'
          onKeyHandle={() => this.moveDotsRight()}
        />
        <KeyHandler
          keyEventName={KEYDOWN}
          keyValue='ArrowUp'
          onKeyHandle={() => this.rotateDots()}
        />

        <div
          style={{
            position: 'relative',
            border: '1px solid #ddd',
            width: `${width}px`,
            height: `${width}px`,
            background: '#fff'
          }}
        >
          <div style={{
            display: this.state.gameover ? 'block' : 'none',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '50px',
            fontFamily: 'Open sans, sans-serif',
            whiteSpace: 'nowrap',
            color: '#d50000',
            fontWeight: 'bold'
          }}>
            GAME OVER
          </div>
          <Levels current={this.state.level} />
          <ReactCSSTransitionGroup
            transitionName='example'
            transitionEnterTimeout={300}
            transitionLeaveTimeout={400}
          >
            {this.state.dots
              .concat(
                this.state.floatingDots.map(i => ({...i, floating: true}))
              )
              .map(params => {
                return <Dot {...params} />
              })}
          </ReactCSSTransitionGroup>
        </div>
      </div>
    )
  }
}

export default () => <Page />

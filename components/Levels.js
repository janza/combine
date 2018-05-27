export default ({ colors, current }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: '100%',
        width: '100%',
        height: `${100}%`,
        display: 'flex',
        flexDirection: 'row-reverse'
      }}
    >
      {colors.map((c, i) => {
        return (
          <div
            key={c}
            style={{
              background: c,
              opacity: current >= i ? 1 : 0.2,
              width: `${100 / colors.length}%`,
              height: `${100 / colors.length}%`
            }}
          />
        )
      })}
    </div>
  )
}

export default ({ colors, x, y, type, outside }) => (
  <div
    style={{
      position: 'absolute',
      transition: !outside ? 'top 0.4s, left 0.06s linear' : '0.1s',
      left: `${100 / 7 * x}%`,
      top: `${100 / 7 * y}%`,
      background: colors[type],
      borderRadius: '50%',
      width: `${100 / 7}%`,
      height: `${100 / 7}%`
    }}
  />
)

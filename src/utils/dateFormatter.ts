export function formatDateExact(isoString: string) {
  const d = new Date(isoString)

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12

  return `${days[d.getDay()]}, ${d.getDate()} ${
    months[d.getMonth()]
  } ${d.getFullYear()} ${hours}:${minutes} ${ampm}`
}

import { StatsDto } from '../stats.dto'

describe('StatsDto', () => {
  it('should create StatsDto instance with default values', () => {
    const stats = new StatsDto()
    
    expect(stats).toBeDefined()
    expect(stats).toBeInstanceOf(StatsDto)
  })

  it('should create StatsDto instance with all properties', () => {
    const stats = new StatsDto()
    stats.total = 100
    stats.attente = 20
    stats.paye = 80
    stats.enfants = 30
    stats.ados = 40
    stats.adultes = 30
    
    expect(stats.total).toBe(100)
    expect(stats.attente).toBe(20)
    expect(stats.paye).toBe(80)
    expect(stats.enfants).toBe(30)
    expect(stats.ados).toBe(40)
    expect(stats.adultes).toBe(30)
  })

  it('should handle zero values', () => {
    const stats = new StatsDto()
    stats.total = 0
    stats.attente = 0
    stats.paye = 0
    stats.enfants = 0
    stats.ados = 0
    stats.adultes = 0
    
    expect(stats.total).toBe(0)
    expect(stats.attente).toBe(0)
    expect(stats.paye).toBe(0)
    expect(stats.enfants).toBe(0)
    expect(stats.ados).toBe(0)
    expect(stats.adultes).toBe(0)
  })

  it('should handle negative values', () => {
    const stats = new StatsDto()
    stats.total = -10
    stats.attente = -5
    stats.paye = -5
    stats.enfants = -3
    stats.ados = -3
    stats.adultes = -4
    
    expect(stats.total).toBe(-10)
    expect(stats.attente).toBe(-5)
    expect(stats.paye).toBe(-5)
    expect(stats.enfants).toBe(-3)
    expect(stats.ados).toBe(-3)
    expect(stats.adultes).toBe(-4)
  })

  it('should handle large numbers', () => {
    const stats = new StatsDto()
    stats.total = 999999
    stats.attente = 100000
    stats.paye = 899999
    stats.enfants = 300000
    stats.ados = 400000
    stats.adultes = 299999
    
    expect(stats.total).toBe(999999)
    expect(stats.attente).toBe(100000)
    expect(stats.paye).toBe(899999)
    expect(stats.enfants).toBe(300000)
    expect(stats.ados).toBe(400000)
    expect(stats.adultes).toBe(299999)
  })

  it('should handle decimal values', () => {
    const stats = new StatsDto()
    stats.total = 100.5
    stats.attente = 20.3
    stats.paye = 80.2
    stats.enfants = 30.1
    stats.ados = 40.2
    stats.adultes = 30.2
    
    expect(stats.total).toBe(100.5)
    expect(stats.attente).toBe(20.3)
    expect(stats.paye).toBe(80.2)
    expect(stats.enfants).toBe(30.1)
    expect(stats.ados).toBe(40.2)
    expect(stats.adultes).toBe(30.2)
  })

  it('should be serializable to JSON', () => {
    const stats = new StatsDto()
    stats.total = 100
    stats.attente = 20
    stats.paye = 80
    stats.enfants = 30
    stats.ados = 40
    stats.adultes = 30
    
    const json = JSON.stringify(stats)
    const parsed = JSON.parse(json)
    
    expect(parsed.total).toBe(100)
    expect(parsed.attente).toBe(20)
    expect(parsed.paye).toBe(80)
    expect(parsed.enfants).toBe(30)
    expect(parsed.ados).toBe(40)
    expect(parsed.adultes).toBe(30)
  })

  it('should be deserializable from JSON', () => {
    const jsonData = {
      total: 100,
      attente: 20,
      paye: 80,
      enfants: 30,
      ados: 40,
      adultes: 30
    }
    
    const stats = Object.assign(new StatsDto(), jsonData)
    
    expect(stats.total).toBe(100)
    expect(stats.attente).toBe(20)
    expect(stats.paye).toBe(80)
    expect(stats.enfants).toBe(30)
    expect(stats.ados).toBe(40)
    expect(stats.adultes).toBe(30)
  })

  it('should handle undefined values', () => {
    const stats = new StatsDto()
    stats.total = undefined as any
    stats.attente = undefined as any
    stats.paye = undefined as any
    stats.enfants = undefined as any
    stats.ados = undefined as any
    stats.adultes = undefined as any
    
    expect(stats.total).toBeUndefined()
    expect(stats.attente).toBeUndefined()
    expect(stats.paye).toBeUndefined()
    expect(stats.enfants).toBeUndefined()
    expect(stats.ados).toBeUndefined()
    expect(stats.adultes).toBeUndefined()
  })

  it('should handle null values', () => {
    const stats = new StatsDto()
    stats.total = null as any
    stats.attente = null as any
    stats.paye = null as any
    stats.enfants = null as any
    stats.ados = null as any
    stats.adultes = null as any
    
    expect(stats.total).toBeNull()
    expect(stats.attente).toBeNull()
    expect(stats.paye).toBeNull()
    expect(stats.enfants).toBeNull()
    expect(stats.ados).toBeNull()
    expect(stats.adultes).toBeNull()
  })

  it('should handle string values', () => {
    const stats = new StatsDto()
    stats.total = '100' as any
    stats.attente = '20' as any
    stats.paye = '80' as any
    stats.enfants = '30' as any
    stats.ados = '40' as any
    stats.adultes = '30' as any
    
    expect(stats.total).toBe('100')
    expect(stats.attente).toBe('20')
    expect(stats.paye).toBe('80')
    expect(stats.enfants).toBe('30')
    expect(stats.ados).toBe('40')
    expect(stats.adultes).toBe('30')
  })

  it('should handle boolean values', () => {
    const stats = new StatsDto()
    stats.total = true as any
    stats.attente = false as any
    stats.paye = true as any
    stats.enfants = false as any
    stats.ados = true as any
    stats.adultes = false as any
    
    expect(stats.total).toBe(true)
    expect(stats.attente).toBe(false)
    expect(stats.paye).toBe(true)
    expect(stats.enfants).toBe(false)
    expect(stats.ados).toBe(true)
    expect(stats.adultes).toBe(false)
  })

  it('should handle object values', () => {
    const stats = new StatsDto()
    const obj = { value: 100 }
    stats.total = obj as any
    stats.attente = obj as any
    stats.paye = obj as any
    stats.enfants = obj as any
    stats.ados = obj as any
    stats.adultes = obj as any
    
    expect(stats.total).toBe(obj)
    expect(stats.attente).toBe(obj)
    expect(stats.paye).toBe(obj)
    expect(stats.enfants).toBe(obj)
    expect(stats.ados).toBe(obj)
    expect(stats.adultes).toBe(obj)
  })

  it('should handle array values', () => {
    const stats = new StatsDto()
    const arr = [1, 2, 3]
    stats.total = arr as any
    stats.attente = arr as any
    stats.paye = arr as any
    stats.enfants = arr as any
    stats.ados = arr as any
    stats.adultes = arr as any
    
    expect(stats.total).toBe(arr)
    expect(stats.attente).toBe(arr)
    expect(stats.paye).toBe(arr)
    expect(stats.enfants).toBe(arr)
    expect(stats.ados).toBe(arr)
    expect(stats.adultes).toBe(arr)
  })

  it('should handle function values', () => {
    const stats = new StatsDto()
    const func = () => 100
    stats.total = func as any
    stats.attente = func as any
    stats.paye = func as any
    stats.enfants = func as any
    stats.ados = func as any
    stats.adultes = func as any
    
    expect(stats.total).toBe(func)
    expect(stats.attente).toBe(func)
    expect(stats.paye).toBe(func)
    expect(stats.enfants).toBe(func)
    expect(stats.ados).toBe(func)
    expect(stats.adultes).toBe(func)
  })
})

// supabase.config.test.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

describe('Supabase Configuration', () => {
  beforeAll(() => {
    dotenv.config({ path: '.env.test' })
  })

  test('Supabase environment variables are properly set', () => {
    expect(process.env.SUPABASE_URL).toBeDefined()
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined()
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
    
    expect(supabase).toBeDefined()
  })

  test('Can connect to Supabase', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
    
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .limit(1)
    
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})
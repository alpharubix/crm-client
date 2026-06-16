import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { ENV } from '@/conf'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type SignInFormValues = z.infer<typeof signInSchema>

export default function SignInPage({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { checkAuth } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormValues) => {
    const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      toast.error('Invalid credentials')
      return
    }

    const user = await checkAuth()

    toast.success('Login successful')

    const isHrRestrict = user && (user.user_id === '3899927000000221552' || user.user_id === '3899927000000527649')
    navigate(isHrRestrict ? '/hiring' : '/accounts')
  }

  return (
    <div
      className={cn(
        'flex flex-col max-w-[400px] p-4 mx-auto gap-6 h-screen justify-center',
        className,
      )}
      {...props}
    >
      <Card>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>Enter your email and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input {...register('email')} />
                {errors.email && (
                  <p className='text-xs text-red-500'>{errors.email.message}</p>
                )}
              </Field>

              <Field>
                <FieldLabel>Password</FieldLabel>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700'
                  >
                    {showPassword ? (
                      <Eye className='h-4 w-4 cursor-pointer' />
                    ) : (
                      <EyeOff className='h-4 w-4 cursor-pointer' />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className='text-xs text-red-500'>
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Button type='submit' disabled={isSubmitting} className='w-full cursor-pointer'>
                {isSubmitting && <Spinner className='mr-2 h-4 w-4' />}
                Sign In
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

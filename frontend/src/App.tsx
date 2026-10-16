import { useQuery } from "@tanstack/react-query"

type User = {
  id: number
  name: string
  email: string
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch(
    'https://jsonplaceholder.typicode.com/users'
  )

  if (!response.ok) {
    throw new Error('Users fetch nahi ho sake')
  }

  return response.json() as Promise<User[]>
}

function App() {
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  if (isPending) {
    return <p>Loading users...</p>
  }

  if (isError) {
    return <p>Error: {error.message}</p>
  }
  return (
    <div>
      <button onClick={() => refetch()}>
        Fetch Users Again
      </button>
      <h1>Users List</h1>
      {isFetching && <p>Refreshing users...</p>}
      {data.map((user) => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  )
}

export default App
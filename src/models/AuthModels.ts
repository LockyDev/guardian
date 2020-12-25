export interface IDBUser {
    id: string
    userId: string
    userFullName: string
    passHash: string
    verified: boolean
    email: string
}

export interface IUserDetail {
    fullName: string
    email: string
    verified: boolean
    userId: string
    authToken: string
}
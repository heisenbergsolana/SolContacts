import { ContactsDocument } from '@/types/contact'
import { Result } from '@/types/result'

/**
 * The persistence contract. Everything above this line works with `Contact`s; everything below it
 * works with bytes.
 *
 * Storage deliberately knows nothing about what makes an address valid — it persists what it is
 * given. Validation belongs to the service layer, so there is exactly one place that decides.
 */
export interface ContactsRepository {
  load(): Promise<Result<ContactsDocument>>
  save(document: ContactsDocument): Promise<Result<void>>
}

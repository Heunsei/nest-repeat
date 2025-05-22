import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  admin,
  paidUser,
  user,
}

@Entity()
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  @Exclude({
    toPlainOnly: true, //응답으로 보낼때만 비밀번호를 주지 않음
  })
  password: string;

  @Column({
    enum: Role,
    default: Role.user,
  })
  role: Role;
}

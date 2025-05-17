import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

// ManyToOne -> Director -> 감독은 여러 영화를 만듬
// OneToMany -> MovieDetail -> 영화는 하나의 상세 내용
// ManyToMany -> genre -> 영화는 여러 장르를 가질 수 있고 장르 또한 그렇다

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  title: string;
  @Column()
  genre: string;
  @OneToOne(() => MovieDetail, (MovieDetail) => MovieDetail.id, {
    cascade: true,
  })
  @JoinColumn()
  detail: MovieDetail;
  @ManyToOne(() => Director, (director) => director.id)
  director: Director;
}

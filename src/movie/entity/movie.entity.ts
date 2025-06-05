import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Transform } from 'class-transformer';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

// ManyToOne -> Director -> 감독은 여러 영화를 만듬
// OneToMany -> MovieDetail -> 영화는 하나의 상세 내용
// ManyToMany -> genre -> 영화는 여러 장르를 가질 수 있고 장르 또한 그렇다

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @ManyToOne(() => User, (user) => user.createdMovies)
  creator: User;

  @Column({ default: 0 })
  likeCount: number;

  @OneToMany(() => MovieUserLike, (movieUserLike) => movieUserLike.movie)
  likedUsers: User[];

  @Column()
  @Transform(({ value }) => `http://localhost:3000/${value}`)
  movieFilePath: string;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @OneToOne(() => MovieDetail, (MovieDetail) => MovieDetail.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;
}
